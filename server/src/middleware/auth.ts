import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/authService';
import { JWTPayload } from '../types/models';

// Extender la interfaz Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

// =============================================
// MIDDLEWARE: Verificar autenticación
// =============================================
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ ok: false, error: 'No autorizado. Token no proporcionado.' });
      return;
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    // Verificar token
    const decoded = verifyToken(token);

    // Agregar datos del usuario al request
    req.user = decoded;

    next();
  } catch (error) {
    res.status(401).json({ ok: false, error: 'Token inválido o expirado' });
  }
};

// =============================================
// MIDDLEWARE: Verificar rol de admin
// =============================================
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ ok: false, error: 'No autorizado' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ ok: false, error: 'Acceso denegado. Se requiere rol de admin.' });
    return;
  }

  next();
};

// =============================================
// MIDDLEWARE: Verificar rol (flexible)
// =============================================
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ ok: false, error: 'No autorizado' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        ok: false,
        error: `Acceso denegado. Se requiere uno de los siguientes roles: ${roles.join(', ')}`,
      });
      return;
    }

    next();
  };
};
