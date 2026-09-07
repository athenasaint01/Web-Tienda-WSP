import pool from '../config/database';

export interface Color {
  id: number;
  code?: string;
  name: string;
  slug: string;
  hex?: string | null;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface ColorInput {
  name: string;
  slug: string;
  hex?: string | null;
  display_order?: number;
}

/**
 * Obtener todos los colores
 */
export const getAllColors = async (): Promise<Color[]> => {
  const result = await pool.query(
    'SELECT * FROM colors ORDER BY display_order ASC, name ASC'
  );
  return result.rows;
};

/**
 * Obtener color por ID
 */
export const getColorById = async (id: number): Promise<Color | null> => {
  const result = await pool.query('SELECT * FROM colors WHERE id = $1', [id]);
  return result.rows[0] || null;
};

/**
 * Obtener color por slug
 */
export const getColorBySlug = async (slug: string): Promise<Color | null> => {
  const result = await pool.query('SELECT * FROM colors WHERE slug = $1', [slug]);
  return result.rows[0] || null;
};

/**
 * Crear nuevo color
 */
export const createColor = async (data: ColorInput): Promise<Color> => {
  const { name, slug, hex, display_order } = data;

  const result = await pool.query(
    `INSERT INTO colors (name, slug, hex, display_order)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [name, slug, hex ?? null, display_order ?? 0]
  );

  return result.rows[0];
};

/**
 * Actualizar color
 */
export const updateColor = async (
  id: number,
  data: Partial<ColorInput>
): Promise<Color | null> => {
  const { name, slug, hex, display_order } = data;

  const result = await pool.query(
    `UPDATE colors
     SET name = COALESCE($1, name),
         slug = COALESCE($2, slug),
         hex = COALESCE($3, hex),
         display_order = COALESCE($4, display_order),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $5
     RETURNING *`,
    [name, slug, hex, display_order, id]
  );

  return result.rows[0] || null;
};

/**
 * Eliminar color (si no tiene productos asociados)
 */
export const deleteColor = async (id: number): Promise<boolean> => {
  const checkProducts = await pool.query(
    'SELECT COUNT(*) FROM product_colors WHERE color_id = $1',
    [id]
  );

  const productCount = parseInt(checkProducts.rows[0].count);

  if (productCount > 0) {
    throw new Error(`No se puede eliminar el color porque tiene ${productCount} producto(s) asociado(s)`);
  }

  const result = await pool.query(
    'DELETE FROM colors WHERE id = $1 RETURNING id',
    [id]
  );

  return result.rowCount ? result.rowCount > 0 : false;
};
