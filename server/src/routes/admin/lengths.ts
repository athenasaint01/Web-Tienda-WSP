import { Router, Response } from 'express';
import * as lengthService from '../../services/lengthService';
import { AuthRequest, authenticateToken, requireAdmin } from '../../middleware/authMiddleware';
import { z } from 'zod';

const router = Router();

router.use(authenticateToken, requireAdmin);

const lengthSchema = z.object({
  label: z.string().min(1).max(20),
  value_cm: z.number().nonnegative(),
  display_order: z.number().int().min(0).optional(),
});

/**
 * POST /api/admin/lengths
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const validation = lengthSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        ok: false,
        error: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const length = await lengthService.createLength(validation.data);
    res.status(201).json({ ok: true, data: length });
  } catch (error: any) {
    console.error('Error al crear largo:', error);
    res.status(500).json({ ok: false, error: error.message || 'Error al crear largo' });
  }
});

/**
 * PUT /api/admin/lengths/:id
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ ok: false, error: 'ID inválido' });
      return;
    }

    const validation = lengthSchema.partial().safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        ok: false,
        error: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const length = await lengthService.updateLength(id, validation.data);

    if (!length) {
      res.status(404).json({ ok: false, error: 'Largo no encontrado' });
      return;
    }

    res.json({ ok: true, data: length });
  } catch (error: any) {
    console.error('Error al actualizar largo:', error);
    res.status(500).json({ ok: false, error: error.message || 'Error al actualizar largo' });
  }
});

/**
 * DELETE /api/admin/lengths/:id
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ ok: false, error: 'ID inválido' });
      return;
    }

    await lengthService.deleteLength(id);
    res.json({ ok: true, message: 'Largo eliminado correctamente' });
  } catch (error: any) {
    console.error('Error al eliminar largo:', error);
    res.status(400).json({ ok: false, error: error.message || 'Error al eliminar largo' });
  }
});

export default router;
