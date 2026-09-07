import { Router, Request, Response } from 'express';
import * as sizeService from '../services/sizeService';

const router = Router();

/**
 * GET /api/sizes
 * Obtener todas las tallas
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const sizes = await sizeService.getAllSizes();
    res.json({ ok: true, data: sizes });
  } catch (error) {
    console.error('Error al obtener tallas:', error);
    res.status(500).json({ ok: false, error: 'Error al obtener tallas' });
  }
});

/**
 * GET /api/sizes/:id
 * Obtener talla por ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ ok: false, error: 'ID inválido' });
      return;
    }

    const size = await sizeService.getSizeById(id);

    if (!size) {
      res.status(404).json({ ok: false, error: 'Talla no encontrada' });
      return;
    }

    res.json({ ok: true, data: size });
  } catch (error) {
    console.error('Error al obtener talla:', error);
    res.status(500).json({ ok: false, error: 'Error al obtener talla' });
  }
});

export default router;
