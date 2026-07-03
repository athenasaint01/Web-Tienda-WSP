import { Router, Response } from 'express';
import pool from '../../config/database';
import { AuthRequest, authenticateToken, requireAdmin } from '../../middleware/authMiddleware';
import { upload } from '../../services/uploadService';
import { uploadImage, deleteImage } from '../../services/cloudinary';

const router = Router();
router.use(authenticateToken, requireAdmin);

// POST /api/admin/popups/upload-image — sube imagen a Cloudinary
router.post('/upload-image', upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) {
      res.status(400).json({ ok: false, error: 'No se envió ninguna imagen' });
      return;
    }
    const url = await uploadImage(file.buffer, 'popups');
    res.json({ ok: true, url });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// GET /api/admin/popups
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM popups ORDER BY created_at DESC'
    );
    res.json({ ok: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// POST /api/admin/popups
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { title, message, image_url, button_text, button_url, is_active, starts_at, ends_at } = req.body;
    const result = await pool.query(
      `INSERT INTO popups (title, message, image_url, button_text, button_url, is_active, starts_at, ends_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [title, message, image_url, button_text, button_url, is_active ?? false, starts_at ?? null, ends_at ?? null]
    );
    res.status(201).json({ ok: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// PUT /api/admin/popups/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { title, message, image_url, button_text, button_url, is_active, starts_at, ends_at } = req.body;

    // Si se activa este popup, desactivar los demás
    if (is_active) {
      await pool.query('UPDATE popups SET is_active = FALSE WHERE id != $1', [id]);
    }

    const result = await pool.query(
      `UPDATE popups
       SET title=$1, message=$2, image_url=$3, button_text=$4, button_url=$5,
           is_active=$6, starts_at=$7, ends_at=$8
       WHERE id=$9
       RETURNING *`,
      [title, message, image_url, button_text, button_url, is_active, starts_at ?? null, ends_at ?? null, id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ ok: false, error: 'Popup no encontrado' });
      return;
    }
    res.json({ ok: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// DELETE /api/admin/popups/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const result = await pool.query('DELETE FROM popups WHERE id=$1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ ok: false, error: 'Popup no encontrado' });
      return;
    }
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
