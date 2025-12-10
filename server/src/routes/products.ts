import { Router, Request, Response } from 'express';
import * as productService from '../services/productService';
import { authenticate, requireAdmin } from '../middleware/auth';
import { ProductFilters } from '../types/models';

const router = Router();

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
