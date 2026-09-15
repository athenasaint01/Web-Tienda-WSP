import { Router, Response } from 'express';
import * as bannerService from '../../services/bannerService';
import { AuthRequest, authenticateToken, requireAdmin } from '../../middleware/authMiddleware';
import { upload, processBannerImage, generateUniqueFilename, deleteBannerImage } from '../../services/uploadService';
import { z } from 'zod';

const router = Router();

// Schema de validación para FormData (POST con archivo)
const bannerFormDataSchema = z.object({
  alt_text: z.string().min(1, 'El texto alternativo es requerido').max(255),
  link_url: z.string().max(500).optional(),
  display_order: z.string().transform(val => val ? parseInt(val) : 0).optional(),
  is_active: z.string().transform(val => val === 'true').optional(),
});

// Schema de validación para JSON (PUT sin archivo)
const bannerSchema = z.object({
  alt_text: z.string().min(1, 'El texto alternativo es requerido').max(255).optional(),
  link_url: z.string().max(500).optional(),
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
 * GET /api/admin/banners
 * Obtener todos los banners (para admin)
 */
router.get('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const banners = await bannerService.getAllBanners();
    res.json({ ok: true, data: banners });
  } catch (error: any) {
    console.error('Error al obtener banners:', error);
    res.status(500).json({ ok: false, error: 'Error al obtener banners' });
  }
});

/**
 * POST /api/admin/banners
 * Crear nuevo banner con imagen
 */
router.post('/', authenticateToken, requireAdmin, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    const validation = bannerFormDataSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        ok: false,
        error: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const bannerData = validation.data;
    const file = req.file;

    if (!file) {
      res.status(400).json({ ok: false, error: 'La imagen es requerida' });
      return;
    }

    const filename = generateUniqueFilename(file.originalname, 'banner');
    const imageUrl = await processBannerImage(file.buffer, filename);

    const banner = await bannerService.createBanner({
      ...bannerData,
      image_url: imageUrl,
    });

    res.status(201).json({ ok: true, data: banner });
  } catch (error: any) {
    console.error('Error al crear banner:', error);
    res.status(500).json({ ok: false, error: error.message || 'Error al crear banner' });
  }
});

/**
 * PUT /api/admin/banners/:id
 * Actualizar banner (con o sin imagen)
 */
router.put('/:id', authenticateToken, requireAdmin, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ ok: false, error: 'ID inválido' });
      return;
    }

    const file = req.file;
    const isFormData = !!file || typeof req.body.alt_text === 'string' && req.headers['content-type']?.includes('multipart');
    let updateData: any;

    if (isFormData) {
      const validation = bannerFormDataSchema.partial().safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({ ok: false, error: 'Datos inválidos', errors: validation.error.flatten().fieldErrors });
        return;
      }
      updateData = validation.data;
    } else {
      const validation = bannerSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({ ok: false, error: 'Datos inválidos', errors: validation.error.flatten().fieldErrors });
        return;
      }
      updateData = validation.data;
    }

    if (file) {
      const existing = await bannerService.getBannerById(id);
      if (existing?.image_url) {
        await deleteBannerImage(existing.image_url);
      }
      const filename = generateUniqueFilename(file.originalname, 'banner');
      updateData.image_url = await processBannerImage(file.buffer, filename);
    }

    const banner = await bannerService.updateBanner(id, updateData);

    if (!banner) {
      res.status(404).json({ ok: false, error: 'Banner no encontrado' });
      return;
    }

    res.json({ ok: true, data: banner });
  } catch (error: any) {
    console.error('Error al actualizar banner:', error);
    res.status(500).json({ ok: false, error: error.message || 'Error al actualizar banner' });
  }
});

/**
 * PATCH /api/admin/banners/reorder
 * Reordenar banners
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

    await bannerService.reorderBanners(validation.data);
    res.json({ ok: true, message: 'Orden actualizado correctamente' });
  } catch (error: any) {
    console.error('Error al reordenar banners:', error);
    res.status(500).json({ ok: false, error: error.message || 'Error al reordenar banners' });
  }
});

/**
 * DELETE /api/admin/banners/:id
 * Eliminar banner y su imagen
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ ok: false, error: 'ID inválido' });
      return;
    }

    const banner = await bannerService.getBannerById(id);

    if (banner) {
      if (banner.image_url) {
        await deleteBannerImage(banner.image_url);
      }
    }

    await bannerService.deleteBanner(id);
    res.json({ ok: true, message: 'Banner eliminado correctamente' });
  } catch (error: any) {
    console.error('Error al eliminar banner:', error);
    res.status(400).json({ ok: false, error: error.message || 'Error al eliminar banner' });
  }
});

export default router;
