import { Router, Response } from 'express';
import * as orderService from '../../services/orderService';
import { AuthRequest, authenticateToken, requireAdmin } from '../../middleware/authMiddleware';
import type { OrderStatus } from '../../types/models';

const router = Router();
router.use(authenticateToken, requireAdmin);

const VALID_STATUS: OrderStatus[] = ['pendiente', 'confirmado', 'descartado'];

// GET /api/admin/orders?status=&page=&limit=
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const result = await orderService.listOrders({
      status: status && VALID_STATUS.includes(status as OrderStatus) ? (status as OrderStatus) : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    });
    res.json({ ok: true, ...result });
  } catch (error: any) {
    console.error('Error al listar pedidos:', error);
    res.status(500).json({ ok: false, error: 'Error al listar pedidos' });
  }
});

// GET /api/admin/orders/pending-count
router.get('/pending-count', async (_req: AuthRequest, res: Response) => {
  try {
    const count = await orderService.countPending();
    res.json({ ok: true, data: { count } });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: 'Error' });
  }
});

// POST /api/admin/orders/:id/confirm — descuenta stock
router.post('/:id/confirm', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ ok: false, error: 'ID inválido' });
      return;
    }
    const { order, stockWarnings } = await orderService.confirmOrder(id);
    res.json({ ok: true, data: order, warnings: stockWarnings });
  } catch (error: any) {
    console.error('Error al confirmar pedido:', error);
    res.status(400).json({ ok: false, error: error.message || 'Error al confirmar pedido' });
  }
});

// POST /api/admin/orders/:id/discard — no toca stock
router.post('/:id/discard', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ ok: false, error: 'ID inválido' });
      return;
    }
    const order = await orderService.discardOrder(id);
    res.json({ ok: true, data: order });
  } catch (error: any) {
    console.error('Error al descartar pedido:', error);
    res.status(400).json({ ok: false, error: error.message || 'Error al descartar pedido' });
  }
});

export default router;
