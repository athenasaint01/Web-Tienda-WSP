import { Router, Response } from 'express';
import * as thicknessService from '../../services/thicknessService';
import { AuthRequest, authenticateToken, requireAdmin } from '../../middleware/authMiddleware';
import { z } from 'zod';

const router = Router();

router.use(authenticateToken, requireAdmin);

const thicknessSchema = z.object({
  name: z.string().min(1).max(20),
  slug: z.string().min(1).max(20).regex(/^[a-z0-9-]+$/),
  level: z.number().int().min(1).max(99),
});

/**
 * POST /api/admin/thicknesses
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const validation = thicknessSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        ok: false,
        error: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const thickness = await thicknessService.createThickness(validation.data);
    res.status(201).json({ ok: true, data: thickness });
  } catch (error: any) {
    console.error('Error al crear grosor:', error);
    res.status(500).json({ ok: false, error: error.message || 'Error al crear grosor' });
  }
});

/**
 * PUT /api/admin/thicknesses/:id
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ ok: false, error: 'ID inválido' });
      return;
    }

    const validation = thicknessSchema.partial().safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        ok: false,
        error: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const thickness = await thicknessService.updateThickness(id, validation.data);

    if (!thickness) {
      res.status(404).json({ ok: false, error: 'Grosor no encontrado' });
      return;
    }

    res.json({ ok: true, data: thickness });
  } catch (error: any) {
    console.error('Error al actualizar grosor:', error);
    res.status(500).json({ ok: false, error: error.message || 'Error al actualizar grosor' });
  }
});

/**
 * DELETE /api/admin/thicknesses/:id
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ ok: false, error: 'ID inválido' });
      return;
    }

    await thicknessService.deleteThickness(id);
    res.json({ ok: true, message: 'Grosor eliminado correctamente' });
  } catch (error: any) {
    console.error('Error al eliminar grosor:', error);
    res.status(400).json({ ok: false, error: error.message || 'Error al eliminar grosor' });
  }
});

export default router;
