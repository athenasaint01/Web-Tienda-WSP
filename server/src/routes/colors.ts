import { Router, Request, Response } from 'express';
import * as colorService from '../services/colorService';

const router = Router();

/**
 * GET /api/colors
 * Obtener todos los colores
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const colors = await colorService.getAllColors();
    res.json({ ok: true, data: colors });
  } catch (error) {
    console.error('Error al obtener colores:', error);
    res.status(500).json({ ok: false, error: 'Error al obtener colores' });
  }
});

/**
 * GET /api/colors/:slug
 * Obtener color por slug
 */
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const color = await colorService.getColorBySlug(slug);

    if (!color) {
      res.status(404).json({ ok: false, error: 'Color no encontrado' });
      return;
    }

    res.json({ ok: true, data: color });
  } catch (error) {
    console.error('Error al obtener color:', error);
    res.status(500).json({ ok: false, error: 'Error al obtener color' });
  }
});

export default router;
