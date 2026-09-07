import { Router, Response } from 'express';
import * as colorService from '../../services/colorService';
import { AuthRequest, authenticateToken, requireAdmin } from '../../middleware/authMiddleware';
import { z } from 'zod';

const router = Router();

router.use(authenticateToken, requireAdmin);

const colorSchema = z.object({
  name: z.string().min(1).max(40),
  slug: z.string().min(1).max(40).regex(/^[a-z0-9-]+$/),
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Hex inválido (formato #RRGGBB)').nullable().optional(),
  display_order: z.number().int().min(0).optional(),
});

/**
 * POST /api/admin/colors
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const validation = colorSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        ok: false,
        error: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const color = await colorService.createColor(validation.data);
    res.status(201).json({ ok: true, data: color });
  } catch (error: any) {
    console.error('Error al crear color:', error);
    res.status(500).json({ ok: false, error: error.message || 'Error al crear color' });
  }
});

/**
 * PUT /api/admin/colors/:id
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ ok: false, error: 'ID inválido' });
      return;
    }

    const validation = colorSchema.partial().safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        ok: false,
        error: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const color = await colorService.updateColor(id, validation.data);

    if (!color) {
      res.status(404).json({ ok: false, error: 'Color no encontrado' });
      return;
    }

    res.json({ ok: true, data: color });
  } catch (error: any) {
    console.error('Error al actualizar color:', error);
    res.status(500).json({ ok: false, error: error.message || 'Error al actualizar color' });
  }
});

/**
 * DELETE /api/admin/colors/:id
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ ok: false, error: 'ID inválido' });
      return;
    }

    await colorService.deleteColor(id);
    res.json({ ok: true, message: 'Color eliminado correctamente' });
  } catch (error: any) {
    console.error('Error al eliminar color:', error);
    res.status(400).json({ ok: false, error: error.message || 'Error al eliminar color' });
  }
});

export default router;
