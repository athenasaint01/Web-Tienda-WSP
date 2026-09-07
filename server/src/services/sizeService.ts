import pool from '../config/database';

export interface Size {
  id: number;
  code?: string;
  label: string;
  ring_size?: number;
  diameter_mm?: number;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface SizeInput {
  label: string;
  ring_size?: number;
  diameter_mm?: number;
  display_order?: number;
}

/**
 * Obtener todas las tallas (ordenadas por valor)
 */
export const getAllSizes = async (): Promise<Size[]> => {
  const result = await pool.query(
    'SELECT * FROM sizes ORDER BY display_order ASC, ring_size ASC'
  );
  return result.rows;
};

/**
 * Obtener talla por ID
 */
export const getSizeById = async (id: number): Promise<Size | null> => {
  const result = await pool.query('SELECT * FROM sizes WHERE id = $1', [id]);
  return result.rows[0] || null;
};

/**
 * Crear nueva talla
 */
export const createSize = async (data: SizeInput): Promise<Size> => {
  const { label, ring_size, diameter_mm, display_order } = data;

  const result = await pool.query(
    `INSERT INTO sizes (label, ring_size, diameter_mm, display_order)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [label, ring_size ?? null, diameter_mm ?? null, display_order ?? 0]
  );

  return result.rows[0];
};

/**
 * Actualizar talla
 */
export const updateSize = async (
  id: number,
  data: Partial<SizeInput>
): Promise<Size | null> => {
  const { label, ring_size, diameter_mm, display_order } = data;

  const result = await pool.query(
    `UPDATE sizes
     SET label = COALESCE($1, label),
         ring_size = COALESCE($2, ring_size),
         diameter_mm = COALESCE($3, diameter_mm),
         display_order = COALESCE($4, display_order),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $5
     RETURNING *`,
    [label, ring_size, diameter_mm, display_order, id]
  );

  return result.rows[0] || null;
};

/**
 * Eliminar talla (si no tiene productos asociados)
 */
export const deleteSize = async (id: number): Promise<boolean> => {
  const checkProducts = await pool.query(
    'SELECT COUNT(*) FROM product_sizes WHERE size_id = $1',
    [id]
  );

  const productCount = parseInt(checkProducts.rows[0].count);

  if (productCount > 0) {
    throw new Error(`No se puede eliminar la talla porque tiene ${productCount} producto(s) asociado(s)`);
  }

  const result = await pool.query(
    'DELETE FROM sizes WHERE id = $1 RETURNING id',
    [id]
  );

  return result.rowCount ? result.rowCount > 0 : false;
};
