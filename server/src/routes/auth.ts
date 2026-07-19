import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import * as authService from '../services/authService';
import { authenticate, requireAdmin } from '../middleware/auth';
import { z } from 'zod';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { ok: false, error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

// =============================================
// SCHEMAS DE VALIDACIÓN
// =============================================

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  role: z.string().optional(),
});

const changePasswordSchema = z.object({
  oldPassword: z.string(),
  newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
});

// =============================================
// RUTAS PÚBLICAS
// =============================================

// POST /api/auth/login - Iniciar sesión
router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  try {
    // Validar datos
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        ok: false,
        error: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const result = await authService.login(validation.data);
    res.json({ ok: true, ...result });
  } catch (error: any) {
    console.error('Error en login:', error);
    res.status(401).json({ ok: false, error: error.message || 'Error al iniciar sesión' });
  }
});

// POST /api/auth/register - Registrar nuevo usuario (requiere admin autenticado)
router.post('/register', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    // Validar datos
    const validation = registerSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        ok: false,
        error: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const result = await authService.register(validation.data);
    res.status(201).json({ ok: true, ...result });
  } catch (error: any) {
    console.error('Error en registro:', error);
    res.status(400).json({ ok: false, error: error.message || 'Error al registrar usuario' });
  }
});

// =============================================
// RUTAS PROTEGIDAS
// =============================================

// GET /api/auth/me - Obtener datos del usuario actual
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ ok: false, error: 'No autorizado' });
      return;
    }

    const user = await authService.getUserById(req.user.userId);

    if (!user) {
      res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
      return;
    }

    res.json({ ok: true, user });
  } catch (error: any) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ ok: false, error: 'Error al obtener usuario' });
  }
});

// POST /api/auth/change-password - Cambiar contraseña
router.post('/change-password', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ ok: false, error: 'No autorizado' });
      return;
    }

    // Validar datos
    const validation = changePasswordSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        ok: false,
        error: 'Datos inválidos',
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { oldPassword, newPassword } = validation.data;

    await authService.changePassword(req.user.userId, oldPassword, newPassword);

    res.json({ ok: true, message: 'Contraseña actualizada exitosamente' });
  } catch (error: any) {
    console.error('Error al cambiar contraseña:', error);
    res.status(400).json({ ok: false, error: error.message || 'Error al cambiar contraseña' });
  }
});

export default router;
