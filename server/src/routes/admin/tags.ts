import { Router, Response } from 'express';
import * as tagService from '../../services/tagService';
import { AuthRequest, authenticateToken, requireAdmin } from '../../middleware/authMiddleware';
import { z } from 'zod';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken, requireAdmin);

// Schema de validación
const tagSchema = z.object({
  name: z.string().min(1).max(50),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
});

/**
 * POST /api/admin/tags
 * Crear nuevo tag
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const validation = tagSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        ok: false,
        error: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const tag = await tagService.createTag(validation.data);
    res.status(201).json({ ok: true, data: tag });
  } catch (error: any) {
    console.error('Error al crear tag:', error);
    res.status(500).json({ ok: false, error: error.message || 'Error al crear tag' });
  }
});

/**
 * PUT /api/admin/tags/:id
 * Actualizar tag
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ ok: false, error: 'ID inválido' });
      return;
    }

    const validation = tagSchema.partial().safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        ok: false,
        error: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const tag = await tagService.updateTag(id, validation.data);

    if (!tag) {
      res.status(404).json({ ok: false, error: 'Tag no encontrado' });
      return;
    }

    res.json({ ok: true, data: tag });
  } catch (error: any) {
    console.error('Error al actualizar tag:', error);
    res.status(500).json({ ok: false, error: error.message || 'Error al actualizar tag' });
  }
});

/**
 * DELETE /api/admin/tags/:id
 * Eliminar tag
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ ok: false, error: 'ID inválido' });
      return;
    }

    await tagService.deleteTag(id);
    res.json({ ok: true, message: 'Tag eliminado correctamente' });
  } catch (error: any) {
    console.error('Error al eliminar tag:', error);
    res.status(400).json({ ok: false, error: error.message || 'Error al eliminar tag' });
  }
});

export default router;
