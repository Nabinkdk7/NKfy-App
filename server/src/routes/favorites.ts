import { Router } from 'express';
import { z } from 'zod';

import { requireAuth } from '../auth.js';
import { db } from '../db.js';
import type { NormalizedTrack } from '../types.js';
import { asyncHandler } from '../utils/http.js';

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

const replaceSchema = z.object({
  tracks: z.array(trackSchema).max(2000),
});

router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = db
      .prepare('SELECT track_json FROM favorites WHERE user_id = ? ORDER BY added_at DESC')
      .all(req.user!.id) as { track_json: string }[];

    res.json({ tracks: rows.map((row) => JSON.parse(row.track_json) as NormalizedTrack) });
  })
);

router.put(
  '/',
  asyncHandler(async (req, res) => {
    const { tracks } = replaceSchema.parse(req.body);

    db.exec('BEGIN');
    try {
      db.prepare('DELETE FROM favorites WHERE user_id = ?').run(req.user!.id);
      const insert = db.prepare(
        'INSERT INTO favorites (user_id, track_id, track_json) VALUES (?, ?, ?)'
      );
      for (const track of tracks) {
        insert.run(req.user!.id, track.id, JSON.stringify(track));
      }
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }

    res.json({ tracks });
  })
);

export default router;
