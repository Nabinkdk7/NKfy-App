import { Readable } from 'node:stream';
import { Router } from 'express';
import { z } from 'zod';

import { config, providerAvailability } from '../config.js';
import { curatedPlaylists, genres } from '../data/curated.js';
import { searchAudius, trendingAudius } from '../providers/audius.js';
import { resolveJamendoStreamUrl, searchJamendo } from '../providers/jamendo.js';
import { searchYouTube } from '../providers/youtube.js';
import type { NormalizedTrack } from '../types.js';
import { ApiError, asyncHandler, routeParam } from '../utils/http.js';

const router = Router();

const searchCache = new Map<
  string,
  { tracks: NormalizedTrack[]; youtube: NormalizedTrack[]; expiresAt: number }
>();

const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(120),
  limit: z.coerce.number().int().min(1).max(30).optional(),
});

router.get('/version', (_req, res) => {
  res.json({
    version: process.env.APP_VERSION || '1.0.0',
    minVersion: process.env.APP_MIN_VERSION || '1.0.0',
    downloadUrl: process.env.DOWNLOAD_URL || '',
    webUrl: process.env.PUBLIC_URL || '',
  });
});

router.get('/providers', (_req, res) => {
  res.json({ providers: providerAvailability });
});

router.get('/genres', (_req, res) => {
  res.json({ genres });
});

router.get(
  '/discover/home',
  asyncHandler(async (_req, res) => {
    const [trendingResult, nepaliResult] = await Promise.allSettled([
      trendingAudius(undefined, 12),
      searchAudius('Nepali', 6),
    ]);

    const global = trendingResult.status === 'fulfilled' ? trendingResult.value : [];
    const nepali = nepaliResult.status === 'fulfilled' ? nepaliResult.value : [];

    const seen = new Set<string>();
    const merged = [...nepali, ...global].filter((track) => {
      if (seen.has(track.id)) return false;
      seen.add(track.id);
      return true;
    });

    res.json({
      featured: curatedPlaylists[0],
      curated: curatedPlaylists.slice(1),
      trending: merged,
      genres,
      providers: providerAvailability,
      degraded: trendingResult.status === 'rejected' && nepaliResult.status === 'rejected',
    });
  })
);

router.get(
  '/discover/curated/:id',
  asyncHandler(async (req, res) => {
    const playlist = curatedPlaylists.find((item) => item.id === req.params.id);
    if (!playlist) {
      throw new ApiError(404, 'Playlist not found', 'playlist_not_found');
    }

    const [audius, jamendo] = await Promise.allSettled([
      searchAudius(playlist.query, 30),
      searchJamendo(playlist.query, 20),
    ]);

    const tracks = [
      ...(audius.status === 'fulfilled' ? audius.value : []),
      ...(jamendo.status === 'fulfilled' ? jamendo.value : []),
    ];

    res.json({
      playlist,
      tracks,
      degraded: audius.status === 'rejected' || jamendo.status === 'rejected',
    });
  })
);

router.get(
  '/trending',
  asyncHandler(async (req, res) => {
    const genre = typeof req.query.genre === 'string' ? req.query.genre.slice(0, 40) : undefined;
    const tracks = await trendingAudius(genre, 20);
    res.json({ tracks });
  })
);

router.get(
  '/search',
  asyncHandler(async (req, res) => {
    const { q, limit = 20 } = searchQuerySchema.parse(req.query);
    const cacheKey = `${q.toLowerCase()}:${limit}`;
    const cached = searchCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      res.json({
        query: q,
        tracks: cached.tracks,
        youtube: cached.youtube,
        providers: providerAvailability,
      });
      return;
    }

    const [audius, jamendo, youtubeGlobal, youtubeNp] = await Promise.allSettled([
      searchAudius(q, limit),
      searchJamendo(q, Math.min(limit, 25)),
      searchYouTube(q, Math.min(Math.max(limit, 10), 25)),
      searchYouTube(q, 15, 'NP'),
    ]);

    const normalizedQuery = q.trim().replace(/\\s+/g, ' ');
    const queryTerms = normalizedQuery
      .toLowerCase()
      .split(' ')
      .map((term) => term.trim())
      .filter((term) => term.length > 1);
    const phrase = normalizedQuery.toLowerCase();

    const isNepali = (track: NormalizedTrack) =>
      /nepal|nepali/i.test(`${track.title} ${track.artist} ${track.genre ?? ''}`);

    const priorityWeight = (track: NormalizedTrack): number => {
      const haystack = `${track.title} ${track.artist} ${track.genre ?? ''} ${track.album ?? ''}`.toLowerCase();
      let weight = 0;
      if (/nepal|nepali/.test(haystack)) weight += 3;
      if (/hindi|bollywood/.test(haystack)) weight += 3;
      if (/english/.test(haystack)) weight += 2;
      if (/metal/.test(haystack)) weight += 3;
      // Official track boost
      if (/official/.test(haystack)) weight += 2;
      return weight;
    };

    const scoreTrack = (track: NormalizedTrack): number => {
      const haystack = `${track.title} ${track.artist} ${track.album ?? ''} ${track.genre ?? ''}`.toLowerCase();
      let score = 0;
      for (const term of queryTerms) {
        if (haystack.includes(term)) score += 1;
      }
      if (haystack.includes(phrase) && phrase.length > 3) score += 3;
      if (track.title.toLowerCase() === phrase) score += 8;
      if (track.title.toLowerCase().startsWith(phrase)) score += 4;
      score += priorityWeight(track);
      return score;
    };

    const tracks = [
      ...(audius.status === 'fulfilled' ? audius.value : []),
      ...(jamendo.status === 'fulfilled' ? jamendo.value : []),
    ];
    const youtubeTracks = [
      ...(youtubeGlobal.status === 'fulfilled' ? youtubeGlobal.value : []),
      ...(youtubeNp.status === 'fulfilled' ? youtubeNp.value : []),
    ];

    // Deduplicate, require at least one significant term, then rank by relevance.
    const seen = new Set<string>();
    const deduped = tracks.filter((track) => {
      if (seen.has(track.id)) return false;
      seen.add(track.id);
      return true;
    });

    const minScore = queryTerms.length > 1 ? 1 : 0;
    const ranked = deduped
      .map((track) => ({ track, score: scoreTrack(track) }))
      .filter(({ score }) => score >= minScore || queryTerms.length === 0)
      .sort((a, b) => b.score - a.score || Number(isNepali(b.track)) - Number(isNepali(a.track)))
      .map(({ track }) => track);

    const seenYt = new Set<string>();
    const rankedYt = youtubeTracks
      .filter((track) => {
        if (seenYt.has(track.id)) return false;
        seenYt.add(track.id);
        return true;
      })
      .map((track) => ({ track, score: scoreTrack(track) }))
      .sort((a, b) => b.score - a.score)
      .map(({ track }) => track);

    const errors: string[] = [];
    if (audius.status === 'rejected') errors.push('audius');
    if (jamendo.status === 'rejected') errors.push('jamendo');
    if (youtubeGlobal.status === 'rejected' && youtubeNp.status === 'rejected') errors.push('youtube');

    searchCache.set(cacheKey, {
      tracks: ranked,
      youtube: rankedYt,
      expiresAt: Date.now() + 3 * 60 * 1000,
    });

    if (searchCache.size > 300) {
      const oldest = searchCache.keys().next().value;
      if (oldest) searchCache.delete(oldest);
    }

    res.json({ query: q, tracks: ranked, youtube: rankedYt, providers: providerAvailability, errors });
  })
);

router.get(
  '/stream/audius/:id',
  asyncHandler(async (req, res) => {
    const id = routeParam(req, 'id').replace(/^audius:/, '');
    if (!/^[A-Za-z0-9_-]{2,80}$/.test(id)) {
      throw new ApiError(400, 'Invalid track id', 'invalid_track');
    }

    const host = 'https://api.audius.co';
    res.redirect(
      302,
      `${host}/v1/tracks/${encodeURIComponent(id)}/stream?app_name=${encodeURIComponent(
        config.audiusAppName
      )}`
    );
  })
);

router.get(
  '/stream/jamendo/:id',
  asyncHandler(async (req, res) => {
    const id = routeParam(req, 'id').replace(/^jamendo:/, '');
    if (!/^[0-9]{1,20}$/.test(id)) {
      throw new ApiError(400, 'Invalid track id', 'invalid_track');
    }

    const url = await resolveJamendoStreamUrl(id);
    if (!url) {
      throw new ApiError(503, 'This track is not available right now', 'stream_unavailable');
    }

    const range = req.header('range');
    const upstream = await fetch(url, {
      headers: range ? { Range: range } : {},
      signal: AbortSignal.timeout(20000),
    });

    if (!upstream.ok && upstream.status !== 206) {
      throw new ApiError(502, 'The music provider rejected the stream', 'upstream_error');
    }

    res.status(upstream.status);
    for (const header of [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'last-modified',
      'etag',
    ]) {
      const value = upstream.headers.get(header);
      if (value) res.setHeader(header, value);
    }
    res.setHeader('Cache-Control', 'private, max-age=3600');

    if (!upstream.body) {
      res.end();
      return;
    }

    Readable.fromWeb(upstream.body as Parameters<typeof Readable.fromWeb>[0]).pipe(res);
  })
);

export default router;
