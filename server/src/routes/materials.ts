import { Router, Request, Response } from 'express';
import * as materialService from '../services/materialService';

const router = Router();

/**
 * GET /api/materials
 * Obtener todos los materiales
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const materials = await materialService.getAllMaterials();
    res.json({ ok: true, data: materials });
  } catch (error) {
    console.error('Error al obtener materiales:', error);
    res.status(500).json({ ok: false, error: 'Error al obtener materiales' });
  }
});

/**
 * GET /api/materials/:slug
 * Obtener material por slug
 */
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const material = await materialService.getMaterialBySlug(slug);

    if (!material) {
      res.status(404).json({ ok: false, error: 'Material no encontrado' });
      return;
    }

    res.json({ ok: true, data: material });
  } catch (error) {
    console.error('Error al obtener material:', error);
    res.status(500).json({ ok: false, error: 'Error al obtener material' });
  }
});

export default router;
