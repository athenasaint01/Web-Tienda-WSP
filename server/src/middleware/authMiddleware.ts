import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tu-secret-super-seguro-cambialo-en-produccion';

// Extender Request para incluir userData
export interface AuthRequest extends Request {
  userData?: {
    userId: number;
    email: string;
    role: string;
  };
}

/**
 * Middleware para verificar JWT token
 */
export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  console.log(`[AUTH] ${req.method} ${req.path}`);
  console.log('[AUTH] Headers:', req.headers);

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    console.log('[AUTH] ❌ Token no proporcionado');
    res.status(401).json({ ok: false, error: 'Token no proporcionado' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      email: string;
      role: string;
    };

    console.log('[AUTH] ✅ Token válido:', decoded);
    req.userData = decoded;
    next();
  } catch (error) {
    console.log('[AUTH] ❌ Token inválido o expirado:', error);
    res.status(403).json({ ok: false, error: 'Token inválido o expirado' });
    return;
  }
};

/**
 * Middleware para verificar rol de admin
 */
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.userData) {
    res.status(401).json({ ok: false, error: 'No autenticado' });
    return;
  }

  if (req.userData.role !== 'admin') {
    res.status(403).json({ ok: false, error: 'Acceso denegado. Se requiere rol de administrador.' });
    return;
  }

  next();
};
