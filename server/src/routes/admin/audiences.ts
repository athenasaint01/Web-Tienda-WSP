import { Router, Response } from 'express';
import * as audienceService from '../../services/audienceService';
import { AuthRequest, authenticateToken, requireAdmin } from '../../middleware/authMiddleware';
import { z } from 'zod';

const router = Router();

router.use(authenticateToken, requireAdmin);

const audienceSchema = z.object({
  name: z.string().min(1).max(30),
  slug: z.string().min(1).max(30).regex(/^[a-z0-9-]+$/),
  display_order: z.number().int().min(0).optional(),
});

/**
 * POST /api/admin/audiences
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const validation = audienceSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        ok: false,
        error: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const audience = await audienceService.createAudience(validation.data);
    res.status(201).json({ ok: true, data: audience });
  } catch (error: any) {
    console.error('Error al crear público:', error);
    res.status(500).json({ ok: false, error: error.message || 'Error al crear público' });
  }
});

/**
 * PUT /api/admin/audiences/:id
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ ok: false, error: 'ID inválido' });
      return;
    }

    const validation = audienceSchema.partial().safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        ok: false,
        error: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const audience = await audienceService.updateAudience(id, validation.data);

    if (!audience) {
      res.status(404).json({ ok: false, error: 'Público no encontrado' });
      return;
    }

    res.json({ ok: true, data: audience });
  } catch (error: any) {
    console.error('Error al actualizar público:', error);
    res.status(500).json({ ok: false, error: error.message || 'Error al actualizar público' });
  }
});

/**
 * DELETE /api/admin/audiences/:id
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ ok: false, error: 'ID inválido' });
      return;
    }

    await audienceService.deleteAudience(id);
    res.json({ ok: true, message: 'Público eliminado correctamente' });
  } catch (error: any) {
    console.error('Error al eliminar público:', error);
    res.status(400).json({ ok: false, error: error.message || 'Error al eliminar público' });
  }
});

export default router;
