import { Router, Request, Response } from 'express';
import * as collectionService from '../services/collectionService';

const router = Router();

/**
 * GET /api/collections
 * Obtener colecciones activas (para el Home)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const collections = await collectionService.getActiveCollections();
    res.json({ ok: true, data: collections });
  } catch (error) {
    console.error('Error al obtener colecciones:', error);
    res.status(500).json({ ok: false, error: 'Error al obtener colecciones' });
  }
});

/**
 * GET /api/collections/:id
 * Obtener colección por ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ ok: false, error: 'ID inválido' });
      return;
    }

    const collection = await collectionService.getCollectionById(id);

    if (!collection) {
      res.status(404).json({ ok: false, error: 'Colección no encontrada' });
      return;
    }

    res.json({ ok: true, data: collection });
  } catch (error) {
    console.error('Error al obtener colección:', error);
    res.status(500).json({ ok: false, error: 'Error al obtener colección' });
  }
});

export default router;
