import { Router, Request, Response } from 'express';
import pool from '../config/database';

const router = Router();

// GET /api/popup/active — devuelve el popup activo (público)
router.get('/active', async (_req: Request, res: Response) => {
  try {
    const now = new Date().toISOString();
    const result = await pool.query(
      `SELECT id, title, message, image_url, button_text, button_url
       FROM popups
       WHERE is_active = TRUE
         AND (starts_at IS NULL OR starts_at <= $1)
         AND (ends_at IS NULL OR ends_at >= $1)
       ORDER BY created_at DESC
       LIMIT 1`,
      [now]
    );
    if (result.rows.length === 0) {
      res.json({ ok: true, data: null });
      return;
    }
    res.json({ ok: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Error al obtener popup activo:', error);
    res.status(500).json({ ok: false, error: 'Error al obtener popup' });
  }
});

export default router;
