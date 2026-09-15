import { Router, Request, Response } from 'express';
import * as bannerService from '../services/bannerService';

const router = Router();

/**
 * GET /api/banners
 * Obtener banners activos (para el Home)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const banners = await bannerService.getActiveBanners();
    res.json({ ok: true, data: banners });
  } catch (error) {
    console.error('Error al obtener banners:', error);
    res.status(500).json({ ok: false, error: 'Error al obtener banners' });
  }
});

export default router;
