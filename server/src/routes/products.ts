import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import * as productService from '../services/productService';
import { authenticate, requireAdmin } from '../middleware/auth';
import { ProductFilters } from '../types/models';

const router = Router();

// Rate limit del endpoint público de métricas: generoso pero acota el abuso.
// 120 hits por IP cada 5 min (una persona navegando dispara ~1-2 por ficha).
const metricLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Demasiadas peticiones' },
});

// =============================================
// RUTAS PÚBLICAS
// =============================================

// GET /api/products - Obtener todos los productos (con filtros)
router.get('/', async (req: Request, res: Response) => {
  try {
    const filters: ProductFilters = {
      category: req.query.categoria as string | string[],
      material: req.query.material as string | string[],
      tag: req.query.tag as string | string[],
      audience: req.query.publico as string | string[],
      thickness: req.query.grosor as string | string[],
      color: req.query.color as string | string[],
      q: req.query.q as string,
      featured: req.query.featured === 'true' ? true : req.query.featured === 'false' ? false : undefined,
      sort: req.query.sort as any,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    const result = await productService.getAllProducts(filters);
    res.json({ ok: true, ...result });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ ok: false, error: 'Error al obtener productos' });
  }
});

// GET /api/products/id/:id - Obtener producto por ID (para admin)
router.get('/id/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const product = await productService.getProductById(id);

    if (!product) {
      res.status(404).json({ ok: false, error: 'Producto no encontrado' });
      return;
    }

    res.json({ ok: true, data: product });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ ok: false, error: 'Error al obtener producto' });
  }
});

// GET /api/products/:slug - Obtener producto por slug
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const product = await productService.getProductBySlug(slug);

    if (!product) {
      res.status(404).json({ ok: false, error: 'Producto no encontrado' });
      return;
    }

    res.json({ ok: true, data: product });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ ok: false, error: 'Error al obtener producto' });
  }
});

// POST /api/products/:id/metric - Registrar una consulta del producto
// Body: { kind: 'view' | 'wa_click' }
//  - 'view'      -> se abrió la ficha del producto
//  - 'wa_click'  -> se pulsó "Consulta este producto" (abre WhatsApp)
// Público, best-effort: nunca bloquea la navegación del cliente.
router.post('/:id/metric', metricLimiter, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const kind = req.body?.kind;
    if (isNaN(id) || (kind !== 'view' && kind !== 'wa_click')) {
      res.status(400).json({ ok: false, error: 'Parámetros inválidos' });
      return;
    }
    await productService.incrementProductMetric(id, kind);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error al registrar métrica de producto:', error);
    // 200 igual: es telemetría, no debe romper nada en el cliente
    res.json({ ok: false });
  }
});

// =============================================
// RUTAS PROTEGIDAS (ADMIN)
// =============================================

// POST /api/products - Crear producto
router.post('/', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json({ ok: true, data: product });
  } catch (error: any) {
    console.error('Error al crear producto:', error);
    res.status(400).json({ ok: false, error: error.message || 'Error al crear producto' });
  }
});

// PUT /api/products/:id - Actualizar producto
router.put('/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const product = await productService.updateProduct(id, req.body);

    if (!product) {
      res.status(404).json({ ok: false, error: 'Producto no encontrado' });
      return;
    }

    res.json({ ok: true, data: product });
  } catch (error: any) {
    console.error('Error al actualizar producto:', error);
    res.status(400).json({ ok: false, error: error.message || 'Error al actualizar producto' });
  }
});

// DELETE /api/products/:id - Eliminar producto (soft delete)
router.delete('/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await productService.deleteProduct(id);

    if (!deleted) {
      res.status(404).json({ ok: false, error: 'Producto no encontrado' });
      return;
    }

    res.json({ ok: true, message: 'Producto desactivado exitosamente' });
  } catch (error: any) {
    console.error('Error al eliminar producto:', error);
    res.status(400).json({ ok: false, error: error.message || 'Error al eliminar producto' });
  }
});

export default router;
