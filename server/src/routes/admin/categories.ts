import { Router, Response } from 'express';
import * as categoryService from '../../services/categoryService';
import { AuthRequest, authenticateToken, requireAdmin } from '../../middleware/authMiddleware';
import { z } from 'zod';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken, requireAdmin);

// Schema de validación
const categorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
});

/**
 * POST /api/admin/categories
 * Crear nueva categoría
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const validation = categorySchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        ok: false,
        error: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const category = await categoryService.createCategory(validation.data);
    res.status(201).json({ ok: true, data: category });
  } catch (error: any) {
    console.error('Error al crear categoría:', error);
    res.status(500).json({ ok: false, error: error.message || 'Error al crear categoría' });
  }
});

/**
 * PUT /api/admin/categories/:id
 * Actualizar categoría
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ ok: false, error: 'ID inválido' });
      return;
    }

    const validation = categorySchema.partial().safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        ok: false,
        error: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const category = await categoryService.updateCategory(id, validation.data);

    if (!category) {
      res.status(404).json({ ok: false, error: 'Categoría no encontrada' });
      return;
    }

    res.json({ ok: true, data: category });
  } catch (error: any) {
    console.error('Error al actualizar categoría:', error);
    res.status(500).json({ ok: false, error: error.message || 'Error al actualizar categoría' });
  }
});

/**
 * DELETE /api/admin/categories/:id
 * Eliminar categoría
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ ok: false, error: 'ID inválido' });
      return;
    }

    await categoryService.deleteCategory(id);
    res.json({ ok: true, message: 'Categoría eliminada correctamente' });
  } catch (error: any) {
    console.error('Error al eliminar categoría:', error);
    res.status(400).json({ ok: false, error: error.message || 'Error al eliminar categoría' });
  }
});

export default router;
