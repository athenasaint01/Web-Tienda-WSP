import { Router, Response } from 'express';
import * as sizeService from '../../services/sizeService';
import { AuthRequest, authenticateToken, requireAdmin } from '../../middleware/authMiddleware';
import { z } from 'zod';

const router = Router();

router.use(authenticateToken, requireAdmin);

const sizeSchema = z.object({
  label: z.string().min(1).max(40),
  ring_size: z.number().nonnegative().optional(),
  diameter_mm: z.number().nonnegative().optional(),
  display_order: z.number().int().min(0).optional(),
});

/**
 * POST /api/admin/sizes
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const validation = sizeSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        ok: false,
        error: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const size = await sizeService.createSize(validation.data);
    res.status(201).json({ ok: true, data: size });
  } catch (error: any) {
    console.error('Error al crear talla:', error);
    res.status(500).json({ ok: false, error: error.message || 'Error al crear talla' });
  }
});

/**
 * PUT /api/admin/sizes/:id
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ ok: false, error: 'ID inválido' });
      return;
    }

    const validation = sizeSchema.partial().safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        ok: false,
        error: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const size = await sizeService.updateSize(id, validation.data);

    if (!size) {
      res.status(404).json({ ok: false, error: 'Talla no encontrada' });
      return;
    }

    res.json({ ok: true, data: size });
  } catch (error: any) {
    console.error('Error al actualizar talla:', error);
    res.status(500).json({ ok: false, error: error.message || 'Error al actualizar talla' });
  }
});

/**
 * DELETE /api/admin/sizes/:id
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ ok: false, error: 'ID inválido' });
      return;
    }

    await sizeService.deleteSize(id);
    res.json({ ok: true, message: 'Talla eliminada correctamente' });
  } catch (error: any) {
    console.error('Error al eliminar talla:', error);
    res.status(400).json({ ok: false, error: error.message || 'Error al eliminar talla' });
  }
});

export default router;
