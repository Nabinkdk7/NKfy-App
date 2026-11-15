import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';

import { requireAuth } from '../auth.js';
import { db } from '../db.js';
import type { NormalizedTrack, Playlist, PlaylistRow } from '../types.js';
import { ApiError, asyncHandler, routeParam } from '../utils/http.js';

const router = Router();

const trackSchema = z
  .object({
    id: z.string().min(1).max(300),
    source: z.enum(['local', 'audius', 'jamendo', 'youtube', 'demo']),
    title: z.string().min(1).max(300),
    artist: z.string().min(1).max(300),
    album: z.string().max(300).optional(),
    artwork: z.string().max(2000).optional(),
    duration: z.number().finite().nonnegative().optional(),
    streamUrl: z.string().max(4000).optional(),
    externalUrl: z.string().max(2000).optional(),
    genre: z.string().max(100).optional(),
    isPlayable: z.boolean(),
    providerLabel: z.string().max(60),
    meta: z.record(z.string(), z.union([z.string(), z.number(), z.undefined()])).optional(),
  })
  .passthrough();

const createPlaylistSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(300).optional(),
  coverUri: z.string().max(2000).optional(),
  tracks: z.array(trackSchema).max(500).optional(),
});

const updatePlaylistSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(300).optional(),
  coverUri: z.string().max(2000).optional(),
});

const replaceTracksSchema = z.object({
  tracks: z.array(trackSchema).max(500),
});

function toPlaylist(row: PlaylistRow): Playlist {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    coverUri: row.cover_uri ?? undefined,
    tracks: JSON.parse(row.tracks_json) as NormalizedTrack[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getOwnedPlaylist(id: string, userId: string): PlaylistRow {
  const row = db
    .prepare('SELECT * FROM playlists WHERE id = ? AND user_id = ?')
    .get(id, userId) as unknown as PlaylistRow | undefined;

  if (!row) {
    throw new ApiError(404, 'Playlist not found', 'playlist_not_found');
  }
  return row;
}

router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = db
      .prepare('SELECT * FROM playlists WHERE user_id = ? ORDER BY updated_at DESC')
      .all(req.user!.id) as unknown as PlaylistRow[];

    res.json({ playlists: rows.map(toPlaylist) });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = createPlaylistSchema.parse(req.body);
    const id = randomUUID();

    db.prepare(
      `INSERT INTO playlists (id, user_id, name, description, cover_uri, tracks_json)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      req.user!.id,
      input.name,
      input.description ?? null,
      input.coverUri ?? null,
      JSON.stringify(input.tracks ?? [])
    );

    const row = getOwnedPlaylist(id, req.user!.id);
    res.status(201).json({ playlist: toPlaylist(row) });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = routeParam(req, 'id');
    const row = getOwnedPlaylist(id, req.user!.id);
    res.json({ playlist: toPlaylist(row) });
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const input = updatePlaylistSchema.parse(req.body);
    const id = routeParam(req, 'id');
    getOwnedPlaylist(id, req.user!.id);

    const fields: string[] = [];
    const values: string[] = [];

    if (input.name !== undefined) {
      fields.push('name = ?');
      values.push(input.name);
    }
    if (input.description !== undefined) {
      fields.push('description = ?');
      values.push(input.description);
    }
    if (input.coverUri !== undefined) {
      fields.push('cover_uri = ?');
      values.push(input.coverUri);
    }

    if (fields.length > 0) {
      fields.push("updated_at = datetime('now')");
      values.push(id, req.user!.id);
      db.prepare(`UPDATE playlists SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`).run(
        ...values
      );
    }

    const row = getOwnedPlaylist(id, req.user!.id);
    res.json({ playlist: toPlaylist(row) });
  })
);

router.put(
  '/:id/tracks',
  asyncHandler(async (req, res) => {
    const input = replaceTracksSchema.parse(req.body);
    const id = routeParam(req, 'id');
    getOwnedPlaylist(id, req.user!.id);

    db.prepare(
      "UPDATE playlists SET tracks_json = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?"
    ).run(JSON.stringify(input.tracks), id, req.user!.id);

    const row = getOwnedPlaylist(id, req.user!.id);
    res.json({ playlist: toPlaylist(row) });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = routeParam(req, 'id');
    getOwnedPlaylist(id, req.user!.id);
    db.prepare('DELETE FROM playlists WHERE id = ? AND user_id = ?').run(
      id,
      req.user!.id
    );
    res.status(204).send();
  })
);

export default router;
