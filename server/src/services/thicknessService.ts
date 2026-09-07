import pool from '../config/database';

export interface Thickness {
  id: number;
  code?: string;
  name: string;
  slug: string;
  level: number;
  created_at: Date;
  updated_at: Date;
}

export interface ThicknessInput {
  name: string;
  slug: string;
  level: number;
}

/**
 * Obtener todos los grosores (ordenados por escala)
 */
export const getAllThicknesses = async (): Promise<Thickness[]> => {
  const result = await pool.query(
    'SELECT * FROM thicknesses ORDER BY level ASC'
  );
  return result.rows;
};

/**
 * Obtener grosor por ID
 */
export const getThicknessById = async (id: number): Promise<Thickness | null> => {
  const result = await pool.query('SELECT * FROM thicknesses WHERE id = $1', [id]);
  return result.rows[0] || null;
};

/**
 * Obtener grosor por slug
 */
export const getThicknessBySlug = async (slug: string): Promise<Thickness | null> => {
  const result = await pool.query('SELECT * FROM thicknesses WHERE slug = $1', [slug]);
  return result.rows[0] || null;
};

/**
 * Crear nuevo grosor
 */
export const createThickness = async (data: ThicknessInput): Promise<Thickness> => {
  const { name, slug, level } = data;

  const result = await pool.query(
    `INSERT INTO thicknesses (name, slug, level)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [name, slug, level]
  );

  return result.rows[0];
};

/**
 * Actualizar grosor
 */
export const updateThickness = async (
  id: number,
  data: Partial<ThicknessInput>
): Promise<Thickness | null> => {
  const { name, slug, level } = data;

  const result = await pool.query(
    `UPDATE thicknesses
     SET name = COALESCE($1, name),
         slug = COALESCE($2, slug),
         level = COALESCE($3, level),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $4
     RETURNING *`,
    [name, slug, level, id]
  );

  return result.rows[0] || null;
};

/**
 * Eliminar grosor (si no tiene productos asociados)
 */
export const deleteThickness = async (id: number): Promise<boolean> => {
  const checkProducts = await pool.query(
    'SELECT COUNT(*) FROM products WHERE thickness_id = $1',
    [id]
  );

  const productCount = parseInt(checkProducts.rows[0].count);

  if (productCount > 0) {
    throw new Error(`No se puede eliminar el grosor porque tiene ${productCount} producto(s) asociado(s)`);
  }

  const result = await pool.query(
    'DELETE FROM thicknesses WHERE id = $1 RETURNING id',
    [id]
  );

  return result.rowCount ? result.rowCount > 0 : false;
};
