import { Router, Response } from 'express';
import { z } from 'zod';
import * as orderService from '../../services/orderService';
import { AuthRequest, authenticateToken, requireAdmin } from '../../middleware/authMiddleware';
import type { OrderStatus } from '../../types/models';

const router = Router();
router.use(authenticateToken, requireAdmin);

const VALID_STATUS: OrderStatus[] = ['pendiente', 'confirmado', 'descartado'];

const createManualOrderSchema = z.object({
  customer_name: z.string().min(2, 'El nombre es muy corto').max(120),
  customer_phone: z.string().max(30).optional().nullable(),
  currency_symbol: z.string().max(5).optional(),
  items: z
    .array(
      z.object({
        product_id: z.number().int().positive(),
        qty: z.number().int().min(1).max(99),
        variant_id: z.number().int().positive().optional(),
        // Precio forzado por el admin (precio especial). Si se omite,
        // se usa el precio de catálogo/variante como siempre.
        unit_price: z.number().min(0).nullable().optional(),
      })
    )
    .min(1, 'El pedido no tiene productos')
    .max(50),
});

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

// POST /api/admin/orders — registra un pedido manual (sin pasar por el
// carrito web). Cada item puede traer unit_price para forzar un precio
// especial; si no viene, se calcula igual que un pedido normal.
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const validation = createManualOrderSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        ok: false,
        error: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }
    const order = await orderService.createManualOrder(validation.data);
    res.status(201).json({ ok: true, data: order });
  } catch (error: any) {
    console.error('Error al registrar pedido manual:', error);
    res.status(400).json({ ok: false, error: error.message || 'No se pudo registrar el pedido' });
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

// GET /api/admin/orders/sales-summary?days=14 — ventas confirmadas por día
router.get('/sales-summary', async (req: AuthRequest, res: Response) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 14;
    const data = await orderService.getSalesSummary(days);
    res.json({ ok: true, data });
  } catch (error: any) {
    console.error('Error al obtener resumen de ventas:', error);
    res.status(500).json({ ok: false, error: 'Error al obtener resumen de ventas' });
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
