import pool from '../config/database';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User, LoginDTO, RegisterUserDTO, AuthResponse, JWTPayload } from '../types/models';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// =============================================
// REGISTRAR NUEVO USUARIO
// =============================================
export const register = async (data: RegisterUserDTO): Promise<AuthResponse> => {
  const { email, password, full_name, role = 'admin' } = data;

  // Verificar si el usuario ya existe
  const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

  if (existingUser.rows.length > 0) {
    throw new Error('El email ya está registrado');
  }

  // Hashear contraseña
  const password_hash = await bcrypt.hash(password, 10);

  // Crear usuario
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, full_name, role, is_active)
     VALUES ($1, $2, $3, $4, TRUE)
     RETURNING id, email, full_name, role`,
    [email, password_hash, full_name, role]
  );

  const user = result.rows[0];

  // Generar JWT
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    },
    token,
  };
};

// =============================================
// LOGIN
// =============================================
export const login = async (data: LoginDTO): Promise<AuthResponse> => {
  const { email, password } = data;

  // Buscar usuario
  const result = await pool.query(
    'SELECT id, email, password_hash, full_name, role, is_active FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw new Error('Credenciales inválidas');
  }

  const user = result.rows[0];

  // Verificar si el usuario está activo
  if (!user.is_active) {
    throw new Error('Usuario desactivado');
  }

  // Verificar contraseña
  const isValidPassword = await bcrypt.compare(password, user.password_hash);

  if (!isValidPassword) {
    throw new Error('Credenciales inválidas');
  }

  // Actualizar last_login
  await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

  // Generar JWT
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    },
    token,
  };
};

// =============================================
// VERIFICAR TOKEN JWT
// =============================================
export const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    throw new Error('Token inválido o expirado');
  }
};

// =============================================
// GENERAR TOKEN JWT
// =============================================
export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(
    { userId: payload.userId, email: payload.email, role: payload.role } as any,
    JWT_SECRET as string,
    { expiresIn: JWT_EXPIRES_IN } as any
  );
};

// =============================================
// OBTENER USUARIO POR ID
// =============================================
export const getUserById = async (id: number): Promise<Omit<User, 'password_hash'> | null> => {
  const result = await pool.query(
    `SELECT id, email, full_name, role, is_active, last_login, created_at, updated_at
     FROM users
     WHERE id = $1`,
    [id]
  );

  return result.rows[0] || null;
};

// =============================================
// CAMBIAR CONTRASEÑA
// =============================================
export const changePassword = async (
  userId: number,
  oldPassword: string,
  newPassword: string
): Promise<boolean> => {
  // Obtener contraseña actual
  const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);

  if (result.rows.length === 0) {
    throw new Error('Usuario no encontrado');
  }

  const user = result.rows[0];

  // Verificar contraseña antigua
  const isValidPassword = await bcrypt.compare(oldPassword, user.password_hash);

  if (!isValidPassword) {
    throw new Error('Contraseña actual incorrecta');
  }

  // Hashear nueva contraseña
  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  // Actualizar contraseña
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, userId]);

  return true;
};
