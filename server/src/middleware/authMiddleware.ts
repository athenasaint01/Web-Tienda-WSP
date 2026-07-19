import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET no definido en variables de entorno');

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
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ ok: false, error: 'Token no proporcionado' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as {
      userId: number;
      email: string;
      role: string;
    };

    req.userData = decoded;
    next();
  } catch (error) {
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
