import { Router, Request, Response } from 'express';
import https from 'https';

const router = Router();

const LATEST_JSON_URL =
  process.env.EZPOS_LATEST_JSON_URL ??
  'https://raw.githubusercontent.com/Reef-hash/EZPos-Upate-System/main/latest.json';

// Cache in-memory for 10 minutes so we don't hammer GitHub on every page load
let cache: { data: object; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000;

// GET /api/downloads/ezpos
router.get('/ezpos', async (_req: Request, res: Response) => {
  try {
    const now = Date.now();
    if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
      res.json(cache.data);
      return;
    }

    const json = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const req = https.get(LATEST_JSON_URL, { headers: { 'User-Agent': 'EZPos-Web-Backend/1.0' } }, (res) => {
        let raw = '';
        res.on('data', (chunk: string) => { raw += chunk; });
        res.on('end', () => {
          try { resolve(JSON.parse(raw)); } catch { reject(new Error('Invalid JSON')); }
        });
      });
      req.on('error', reject);
      req.setTimeout(8000, () => { req.destroy(new Error('Timeout')); });
    });

    const data = {
      version:       json.version       ?? null,
      name:          json.name          ?? null,
      publishedDate: json.publishedDate ?? null,
      releaseNotes:  json.releaseNotes  ?? null,
      downloadUrl:   json.downloadUrl   ?? null,
      checksum:      json.checksum      ?? null,
    };

    cache = { data, fetchedAt: now };
    res.json(data);
  } catch (err) {
    console.error('[downloads] Failed to fetch latest.json:', err);
    // Return cached stale data if available rather than failing completely
    if (cache) {
      res.json({ ...cache.data, stale: true });
      return;
    }
    res.status(503).json({ error: 'Download info temporarily unavailable' });
  }
});

export default router;
