import { Router, Request, Response } from 'express';
import * as lengthService from '../services/lengthService';

const router = Router();

/**
 * GET /api/lengths
 * Obtener todos los largos
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const lengths = await lengthService.getAllLengths();
    res.json({ ok: true, data: lengths });
  } catch (error) {
    console.error('Error al obtener largos:', error);
    res.status(500).json({ ok: false, error: 'Error al obtener largos' });
  }
});

/**
 * GET /api/lengths/:id
 * Obtener largo por ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ ok: false, error: 'ID inválido' });
      return;
    }

    const length = await lengthService.getLengthById(id);

    if (!length) {
      res.status(404).json({ ok: false, error: 'Largo no encontrado' });
      return;
    }

    res.json({ ok: true, data: length });
  } catch (error) {
    console.error('Error al obtener largo:', error);
    res.status(500).json({ ok: false, error: 'Error al obtener largo' });
  }
});

export default router;
