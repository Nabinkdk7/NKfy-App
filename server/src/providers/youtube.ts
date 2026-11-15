import { config } from '../config.js';
import type { NormalizedTrack } from '../types.js';

interface YouTubeSearchItem {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    channelTitle?: string;
    thumbnails?: Record<string, { url?: string } | undefined>;
  };
}

interface YouTubeSearchResponse {
  items?: YouTubeSearchItem[];
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

/**
 * Discovery only. YouTube playback always happens in the official YouTube
 * player — the API never resolves or proxies audio/video streams.
 */
export async function searchYouTube( query: string, limit = 10, regionCode?: string ): Promise<NormalizedTrack[]> {
  if (!config.youtubeApiKey) return [];

  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    maxResults: String(Math.min(Math.max(limit, 1), 50)),
    q: query,
    order: 'relevance',
    key: config.youtubeApiKey,
  });
  const rc = regionCode !== undefined ? regionCode : '';
  if (rc) params.set('regionCode', rc);
  if (!rc && (config.relevanceLanguage || '')) {
    params.set('relevanceLanguage', config.relevanceLanguage);
  }

  const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error(`[youtube] search failed ${response.status}: ${body.slice(0, 200)}`);
    throw new Error(`YouTube responded with ${response.status}`);
  }

  const payload = (await response.json()) as YouTubeSearchResponse;

  return (payload.items ?? []).flatMap((item): NormalizedTrack[] => {
    const videoId = item.id?.videoId;
    const title = item.snippet?.title;
    if (!videoId || !title) return [];

    const thumbnails = item.snippet?.thumbnails;
    const artwork =
      thumbnails?.high?.url || thumbnails?.medium?.url || thumbnails?.default?.url;

    return [
      {
        id: `youtube:${videoId}`,
        source: 'youtube',
        title: decodeHtmlEntities(title),
        artist: decodeHtmlEntities(item.snippet?.channelTitle || 'YouTube'),
        artwork,
        externalUrl: `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
        isPlayable: false,
        providerLabel: 'YouTube',
        meta: { videoId },
      },
    ];
  });
}
