import { Router, Response } from 'express';
import * as materialService from '../../services/materialService';
import { AuthRequest, authenticateToken, requireAdmin } from '../../middleware/authMiddleware';
import { z } from 'zod';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken, requireAdmin);

// Schema de validación
const materialSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
});

/**
 * POST /api/admin/materials
 * Crear nuevo material
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const validation = materialSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        ok: false,
        error: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const material = await materialService.createMaterial(validation.data);
    res.status(201).json({ ok: true, data: material });
  } catch (error: any) {
    console.error('Error al crear material:', error);
    res.status(500).json({ ok: false, error: error.message || 'Error al crear material' });
  }
});

/**
 * PUT /api/admin/materials/:id
 * Actualizar material
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ ok: false, error: 'ID inválido' });
      return;
    }

    const validation = materialSchema.partial().safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        ok: false,
        error: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const material = await materialService.updateMaterial(id, validation.data);

    if (!material) {
      res.status(404).json({ ok: false, error: 'Material no encontrado' });
      return;
    }

    res.json({ ok: true, data: material });
  } catch (error: any) {
    console.error('Error al actualizar material:', error);
    res.status(500).json({ ok: false, error: error.message || 'Error al actualizar material' });
  }
});

/**
 * DELETE /api/admin/materials/:id
 * Eliminar material
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ ok: false, error: 'ID inválido' });
      return;
    }

    await materialService.deleteMaterial(id);
    res.json({ ok: true, message: 'Material eliminado correctamente' });
  } catch (error: any) {
    console.error('Error al eliminar material:', error);
    res.status(400).json({ ok: false, error: error.message || 'Error al eliminar material' });
  }
});

export default router;
