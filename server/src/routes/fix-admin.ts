import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database';

const router = Router();

/**
 * Endpoint temporal para actualizar la contraseña del admin
 * DELETE THIS AFTER USE!
 */
router.post('/fix-admin-password', async (req: Request, res: Response) => {
  try {
    const password = 'admin123';
    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `UPDATE users
       SET password_hash = $1
       WHERE email = 'admin@alahas.com'
       RETURNING id, email, full_name, role`,
      [password_hash]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ ok: false, error: 'Usuario admin no encontrado' });
      return;
    }

    res.json({
      ok: true,
      message: 'Contraseña actualizada correctamente',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error actualizando contraseña:', error);
    res.status(500).json({ ok: false, error: 'Error al actualizar contraseña' });
  }
});

export default router;
