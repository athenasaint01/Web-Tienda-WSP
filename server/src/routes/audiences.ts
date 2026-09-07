import { Router, Request, Response } from 'express';
import * as audienceService from '../services/audienceService';

const router = Router();

/**
 * GET /api/audiences
 * Obtener todos los públicos
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const audiences = await audienceService.getAllAudiences();
    res.json({ ok: true, data: audiences });
  } catch (error) {
    console.error('Error al obtener públicos:', error);
    res.status(500).json({ ok: false, error: 'Error al obtener públicos' });
  }
});

/**
 * GET /api/audiences/:slug
 * Obtener público por slug
 */
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const audience = await audienceService.getAudienceBySlug(slug);

    if (!audience) {
      res.status(404).json({ ok: false, error: 'Público no encontrado' });
      return;
    }

    res.json({ ok: true, data: audience });
  } catch (error) {
    console.error('Error al obtener público:', error);
    res.status(500).json({ ok: false, error: 'Error al obtener público' });
  }
});

export default router;
