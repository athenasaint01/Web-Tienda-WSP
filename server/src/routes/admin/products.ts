import { Router, Response } from 'express';
import * as productService from '../../services/productService';
import { AuthRequest, authenticateToken, requireAdmin } from '../../middleware/authMiddleware';
import { upload, processImage, generateUniqueFilename, deleteImageFiles, extractImageUrls } from '../../services/uploadService';
import { z } from 'zod';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken, requireAdmin);

// Schema de validación para producto (sin imágenes, se manejan aparte)
const productDataSchema = z.object({
  slug: z.string().min(1).max(150).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(255),
  category_id: z.string().transform(val => parseInt(val)),
  description: z.string().optional(),
  featured: z.string().transform(val => val === 'true').optional(),
  stock: z.string().transform(val => val ? parseInt(val) : 0).optional(),
  low_stock_threshold: z.string().transform(val => val ? parseInt(val) : 5).optional(),
  wa_template: z.string().optional(),
  is_active: z.string().transform(val => val === 'true').optional(),
  material_ids: z.string().transform(val => {
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  }).optional(),
  tag_ids: z.string().transform(val => {
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  }).optional(),
});

/**
 * POST /api/admin/products
 * Crear nuevo producto con imágenes
 */
router.post('/', upload.array('images', 6), async (req: AuthRequest, res: Response) => {
  try {
    // Validar datos del formulario
    const validation = productDataSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        ok: false,
        error: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const productData = validation.data;
    const files = req.files as Express.Multer.File[];

    // Procesar imágenes si existen
    let imageUrls: Array<{ url: string; is_primary: boolean; alt_text?: string }> = [];

    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filename = generateUniqueFilename(file.originalname, productData.slug);

        try {
          // Procesar imagen y generar 3 tamaños
          const paths = await processImage(file.buffer, filename);

          // Guardamos la ruta "medium" como principal
          imageUrls.push({
            url: paths.medium,
            is_primary: i === 0, // La primera es la principal
            alt_text: productData.name,
          });
        } catch (error) {
          console.error(`Error procesando imagen ${i + 1}:`, error);
          // Continuar con las demás imágenes
        }
      }
    }

    // Crear producto con imágenes
    const product = await productService.createProduct({
      ...productData,
      images: imageUrls,
    });

    res.status(201).json({ ok: true, data: product });
  } catch (error: any) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ ok: false, error: error.message || 'Error al crear producto' });
  }
});

/**
 * PUT /api/admin/products/:id
 * Actualizar producto (datos básicos sin imágenes)
 */
router.put('/:id', upload.array('images', 6), async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ ok: false, error: 'ID inválido' });
      return;
    }

    const files = req.files as Express.Multer.File[] | undefined;

    // Schema for FormData (when images are included)
    const updateFormDataSchema = z.object({
      slug: z.string().min(1).max(150).regex(/^[a-z0-9-]+$/).optional(),
      name: z.string().min(1).max(255).optional(),
      category_id: z.string().transform(val => val ? parseInt(val) : undefined).optional(),
      description: z.string().optional(),
      featured: z.string().transform(val => val === 'true').optional(),
      stock: z.string().transform(val => val ? parseInt(val) : undefined).optional(),
      low_stock_threshold: z.string().transform(val => val ? parseInt(val) : undefined).optional(),
      wa_template: z.string().optional(),
      is_active: z.string().transform(val => val === 'true').optional(),
      material_ids: z.string().transform(val => {
        try {
          return val ? JSON.parse(val) : undefined;
        } catch {
          return undefined;
        }
      }).optional(),
      tag_ids: z.string().transform(val => {
        try {
          return val ? JSON.parse(val) : undefined;
        } catch {
          return undefined;
        }
      }).optional(),
      deleted_images: z.string().transform(val => {
        try {
          return val ? JSON.parse(val) : [];
        } catch {
          return [];
        }
      }).optional(),
    });

    // Schema for JSON (when no images)
    const updateJsonSchema = z.object({
      slug: z.string().min(1).max(150).regex(/^[a-z0-9-]+$/).optional(),
      name: z.string().min(1).max(255).optional(),
      category_id: z.number().int().positive().optional(),
      description: z.string().optional(),
      featured: z.boolean().optional(),
      stock: z.number().int().min(0).optional(),
      low_stock_threshold: z.number().int().min(0).optional(),
      wa_template: z.string().optional(),
      is_active: z.boolean().optional(),
      material_ids: z.array(z.number().int().positive()).optional(),
      tag_ids: z.array(z.number().int().positive()).optional(),
    });

    // Determine if this is FormData or JSON
    // FormData is used when: 1) there are new files OR 2) deleted_images field is present
    const hasDeletedImages = req.body.deleted_images !== undefined;
    const isFormData = (files && files.length > 0) || hasDeletedImages;
    const schema = isFormData ? updateFormDataSchema : updateJsonSchema;
    const validation = schema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        ok: false,
        error: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    // Process deleted images first
    const deletedImages = (validation.data as any).deleted_images || [];
    if (deletedImages.length > 0) {
      for (const imageUrl of deletedImages) {
        // Delete files from filesystem
        await deleteImageFiles(imageUrl);
        // Delete from database
        await productService.deleteProductImageByUrl(id, imageUrl);
      }
    }

    // Remove deleted_images from data before updating product
    const { deleted_images, ...productUpdateData } = validation.data as any;

    // Update product
    const product = await productService.updateProduct(id, productUpdateData);

    if (!product) {
      res.status(404).json({ ok: false, error: 'Producto no encontrado' });
      return;
    }

    // If there are new images, process and add them
    if (files && files.length > 0) {
      const productSlug = validation.data.slug || product.slug;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filename = generateUniqueFilename(file.originalname, productSlug);
        const paths = await processImage(file.buffer, filename);

        // Add image to database
        await productService.addProductImage(id, {
          url: paths.medium,
          is_primary: false,
          alt_text: `${product.name} - Imagen ${i + 1}`,
        });
      }
    }

    res.json({ ok: true, data: product });
  } catch (error: any) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ ok: false, error: error.message || 'Error al actualizar producto' });
  }
});

/**
 * POST /api/admin/products/:id/images
 * Agregar imágenes a un producto existente
 */
router.post('/:id/images', upload.array('images', 6), async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ ok: false, error: 'ID inválido' });
      return;
    }

    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({ ok: false, error: 'No se enviaron imágenes' });
      return;
    }

    // Obtener producto para usar su slug
    const product = await productService.getProductById(id);

    if (!product || !product.ok) {
      res.status(404).json({ ok: false, error: 'Producto no encontrado' });
      return;
    }

    const productSlug = product.data.slug;
    const imageUrls: Array<{ url: string; is_primary: boolean; alt_text?: string }> = [];

    // Contar imágenes existentes
    const existingImagesCount = product.data.images?.length || 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filename = generateUniqueFilename(file.originalname, productSlug);

      try {
        const paths = await processImage(file.buffer, filename);

        imageUrls.push({
          url: paths.medium,
          is_primary: existingImagesCount === 0 && i === 0, // Primera imagen si no hay otras
          alt_text: product.data.name,
        });
      } catch (error) {
        console.error(`Error procesando imagen ${i + 1}:`, error);
      }
    }

    // Agregar imágenes al producto
    await productService.addProductImages(id, imageUrls);

    res.status(201).json({ ok: true, message: `${imageUrls.length} imagen(es) agregada(s)` });
  } catch (error: any) {
    console.error('Error al agregar imágenes:', error);
    res.status(500).json({ ok: false, error: error.message || 'Error al agregar imágenes' });
  }
});

/**
 * DELETE /api/admin/products/:id/images/:imageId
 * Eliminar una imagen específica de un producto
 */
router.delete('/:id/images/:imageId', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const imageId = parseInt(req.params.imageId);

    if (isNaN(id) || isNaN(imageId)) {
      res.status(400).json({ ok: false, error: 'ID inválido' });
      return;
    }

    // Obtener información de la imagen antes de eliminarla
    const product = await productService.getProductById(id);

    if (!product || !product.ok) {
      res.status(404).json({ ok: false, error: 'Producto no encontrado' });
      return;
    }

    const image = product.data.images?.find((img: any) => img.id === imageId);

    if (!image) {
      res.status(404).json({ ok: false, error: 'Imagen no encontrada' });
      return;
    }

    // Eliminar imagen de la BD
    await productService.deleteProductImage(imageId);

    // Eliminar archivos físicos
    if (image.image_url.startsWith('/uploads/')) {
      await deleteImageFiles(image.image_url);
    }

    res.json({ ok: true, message: 'Imagen eliminada correctamente' });
  } catch (error: any) {
    console.error('Error al eliminar imagen:', error);
    res.status(500).json({ ok: false, error: error.message || 'Error al eliminar imagen' });
  }
});

/**
 * DELETE /api/admin/products/:id
 * Eliminar producto y sus imágenes
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ ok: false, error: 'ID inválido' });
      return;
    }

    // Obtener producto para eliminar sus imágenes
    const product = await productService.getProductById(id);

    if (product) {
      // Eliminar archivos de imágenes
      const imageUrls = extractImageUrls(product);
      console.log(`[DELETE PRODUCT] Eliminando ${imageUrls.length} imágenes para producto ${id}`);
      for (const url of imageUrls) {
        console.log(`[DELETE PRODUCT] Eliminando imagen: ${url}`);
        await deleteImageFiles(url);
      }
    } else {
      console.log(`[DELETE PRODUCT] No se encontró el producto ${id} o no tiene imágenes`);
    }

    // Eliminar producto permanentemente de la BD
    const success = await productService.hardDeleteProduct(id);

    if (!success) {
      res.status(404).json({ ok: false, error: 'Producto no encontrado' });
      return;
    }

    res.json({ ok: true, message: 'Producto eliminado permanentemente' });
  } catch (error: any) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ ok: false, error: error.message || 'Error al eliminar producto' });
  }
});

export default router;
