import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import * as orderService from '../services/orderService';

const router = Router();

// Rate limit: 10 pedidos por IP cada 15 minutos (evita spam del endpoint público)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { ok: false, error: 'Demasiados pedidos. Intenta de nuevo en unos minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const createOrderSchema = z.object({
  customer_name: z.string().min(2, 'El nombre es muy corto').max(120),
  customer_phone: z.string().max(30).optional().nullable(),
  currency_symbol: z.string().max(5).optional(),
  items: z
    .array(
      z.object({
        product_id: z.number().int().positive(),
        qty: z.number().int().min(1).max(99),
      })
    )
    .min(1, 'El pedido no tiene productos')
    .max(50),
});

// POST /api/orders — crea un pedido en estado 'pendiente'
router.post('/', limiter, async (req: Request, res: Response) => {
  try {
    const validation = createOrderSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        ok: false,
        error: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const order = await orderService.createOrder(validation.data);
    res.status(201).json({ ok: true, data: { id: order.id } });
  } catch (error: any) {
    console.error('Error al crear pedido:', error);
    res.status(500).json({ ok: false, error: 'No se pudo registrar el pedido' });
  }
});

export default router;
