import { Router, Response } from 'express';
import * as collectionService from '../../services/collectionService';
import { AuthRequest, authenticateToken, requireAdmin } from '../../middleware/authMiddleware';
import { upload, processCollectionImage, generateUniqueFilename, deleteCollectionImage } from '../../services/uploadService';
import { z } from 'zod';

const router = Router();

// Schema de validación para FormData (POST con archivo)
const collectionFormDataSchema = z.object({
  category_id: z.string().transform(val => parseInt(val)),
  title: z.string().min(1, 'El título es requerido').max(255),
  description: z.string().optional(),
  display_order: z.string().transform(val => val ? parseInt(val) : 0).optional(),
  is_active: z.string().transform(val => val === 'true').optional(),
});

// Schema de validación para JSON (PUT sin archivo)
const collectionSchema = z.object({
  category_id: z.number().int().positive('La categoría es requerida').optional(),
  title: z.string().min(1, 'El título es requerido').max(255).optional(),
  description: z.string().optional(),
  display_order: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});

const reorderSchema = z.array(
  z.object({
    id: z.number().int().positive(),
    display_order: z.number().int().min(0),
  })
);

/**
 * GET /api/admin/collections
 * Obtener todas las colecciones (para admin)
 */
router.get('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const collections = await collectionService.getAllCollections();
    res.json({ ok: true, data: collections });
  } catch (error: any) {
    console.error('Error al obtener colecciones:', error);
    res.status(500).json({ ok: false, error: 'Error al obtener colecciones' });
  }
});

/**
 * POST /api/admin/collections
 * Crear nueva colección con imagen
 */
router.post('/', authenticateToken, requireAdmin, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    // Validar datos del formulario
    const validation = collectionFormDataSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        ok: false,
        error: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const collectionData = validation.data;
    const file = req.file;

    if (!file) {
      res.status(400).json({ ok: false, error: 'La imagen es requerida' });
      return;
    }

    // Procesar imagen
    const filename = generateUniqueFilename(file.originalname, 'collection');
    const imageUrl = await processCollectionImage(file.buffer, filename);

    // Crear colección
    const collection = await collectionService.createCollection({
      ...collectionData,
      image_url: imageUrl,
    });

    res.status(201).json({ ok: true, data: collection });
  } catch (error: any) {
    console.error('Error al crear colección:', error);
    res.status(500).json({ ok: false, error: error.message || 'Error al crear colección' });
  }
});

/**
 * PUT /api/admin/collections/:id
 * Actualizar colección (sin imagen)
 */
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ ok: false, error: 'ID inválido' });
      return;
    }

    const validation = collectionSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        ok: false,
        error: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const collection = await collectionService.updateCollection(id, validation.data);

    if (!collection) {
      res.status(404).json({ ok: false, error: 'Colección no encontrada' });
      return;
    }

    res.json({ ok: true, data: collection });
  } catch (error: any) {
    console.error('Error al actualizar colección:', error);
    res.status(500).json({ ok: false, error: error.message || 'Error al actualizar colección' });
  }
});

/**
 * PATCH /api/admin/collections/reorder
 * Reordenar colecciones
 */
router.patch('/reorder', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const validation = reorderSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        ok: false,
        error: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    await collectionService.reorderCollections(validation.data);
    res.json({ ok: true, message: 'Orden actualizado correctamente' });
  } catch (error: any) {
    console.error('Error al reordenar colecciones:', error);
    res.status(500).json({ ok: false, error: error.message || 'Error al reordenar colecciones' });
  }
});

/**
 * DELETE /api/admin/collections/:id
 * Eliminar colección y su imagen
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ ok: false, error: 'ID inválido' });
      return;
    }

    // Obtener colección para eliminar su imagen
    const collection = await collectionService.getCollectionById(id);

    if (collection) {
      // Eliminar archivo de imagen del servidor
      if (collection.image_url) {
        await deleteCollectionImage(collection.image_url);
      }
    }

    // Eliminar colección de la BD
    await collectionService.deleteCollection(id);
    res.json({ ok: true, message: 'Colección eliminada correctamente' });
  } catch (error: any) {
    console.error('Error al eliminar colección:', error);
    res.status(400).json({ ok: false, error: error.message || 'Error al eliminar colección' });
  }
});

export default router;
