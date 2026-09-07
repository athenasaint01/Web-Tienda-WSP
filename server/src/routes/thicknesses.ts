import { Router, Request, Response } from 'express';
import * as thicknessService from '../services/thicknessService';

const router = Router();

/**
 * GET /api/thicknesses
 * Obtener todos los grosores
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const thicknesses = await thicknessService.getAllThicknesses();
    res.json({ ok: true, data: thicknesses });
  } catch (error) {
    console.error('Error al obtener grosores:', error);
    res.status(500).json({ ok: false, error: 'Error al obtener grosores' });
  }
});

/**
 * GET /api/thicknesses/:slug
 * Obtener grosor por slug
 */
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const thickness = await thicknessService.getThicknessBySlug(slug);

    if (!thickness) {
      res.status(404).json({ ok: false, error: 'Grosor no encontrado' });
      return;
    }

    res.json({ ok: true, data: thickness });
  } catch (error) {
    console.error('Error al obtener grosor:', error);
    res.status(500).json({ ok: false, error: 'Error al obtener grosor' });
  }
});

export default router;
