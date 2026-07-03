import { Router, Request, Response } from 'express';
import pool from '../config/database';

const router = Router();

// GET /api/settings — devuelve todas las settings como objeto { key: value }
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT key, value FROM settings');
    const settings: Record<string, string> = {};
    for (const row of result.rows) {
      settings[row.key] = row.value;
    }
    res.json({ ok: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
