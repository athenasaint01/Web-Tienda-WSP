import { Router, Request, Response } from 'express';
import * as categoryService from '../services/categoryService';

const router = Router();

/**
 * GET /api/categories
 * Obtener todas las categorías
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const categories = await categoryService.getAllCategories();
    res.json({ ok: true, data: categories });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ ok: false, error: 'Error al obtener categorías' });
  }
});

/**
 * GET /api/categories/:slug
 * Obtener categoría por slug
 */
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const category = await categoryService.getCategoryBySlug(slug);

    if (!category) {
      res.status(404).json({ ok: false, error: 'Categoría no encontrada' });
      return;
    }

    res.json({ ok: true, data: category });
  } catch (error) {
    console.error('Error al obtener categoría:', error);
    res.status(500).json({ ok: false, error: 'Error al obtener categoría' });
  }
});

export default router;
