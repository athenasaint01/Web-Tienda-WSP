import { Router, Request, Response } from 'express';
import * as tagService from '../services/tagService';

const router = Router();

/**
 * GET /api/tags
 * Obtener todos los tags
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const tags = await tagService.getAllTags();
    res.json({ ok: true, data: tags });
  } catch (error) {
    console.error('Error al obtener tags:', error);
    res.status(500).json({ ok: false, error: 'Error al obtener tags' });
  }
});

/**
 * GET /api/tags/:slug
 * Obtener tag por slug
 */
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const tag = await tagService.getTagBySlug(slug);

    if (!tag) {
      res.status(404).json({ ok: false, error: 'Tag no encontrado' });
      return;
    }

    res.json({ ok: true, data: tag });
  } catch (error) {
    console.error('Error al obtener tag:', error);
    res.status(500).json({ ok: false, error: 'Error al obtener tag' });
  }
});

export default router;
