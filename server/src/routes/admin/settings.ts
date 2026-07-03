import { Router, Response } from 'express';
import pool from '../../config/database';
import { AuthRequest, authenticateToken, requireAdmin } from '../../middleware/authMiddleware';

const router = Router();
router.use(authenticateToken, requireAdmin);

// GET /api/admin/settings
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT key, value FROM settings ORDER BY key');
    const settings: Record<string, string> = {};
    for (const row of result.rows) {
      settings[row.key] = row.value;
    }
    res.json({ ok: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// PUT /api/admin/settings — recibe { key: value, ... } y hace upsert
router.put('/', async (req: AuthRequest, res: Response) => {
  try {
    const entries = Object.entries(req.body as Record<string, string>);
    if (entries.length === 0) {
      res.status(400).json({ ok: false, error: 'No se enviaron datos' });
      return;
    }
    for (const [key, value] of entries) {
      await pool.query(
        `INSERT INTO settings (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        [key, value]
      );
    }
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
