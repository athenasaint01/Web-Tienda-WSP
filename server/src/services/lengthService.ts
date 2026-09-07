import pool from '../config/database';

export interface Length {
  id: number;
  code?: string;
  label: string;
  value_cm: number;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface LengthInput {
  label: string;
  value_cm: number;
  display_order?: number;
}

/**
 * Obtener todos los largos (ordenados por valor en cm)
 */
export const getAllLengths = async (): Promise<Length[]> => {
  const result = await pool.query(
    'SELECT * FROM lengths ORDER BY display_order ASC, value_cm ASC'
  );
  return result.rows;
};

/**
 * Obtener largo por ID
 */
export const getLengthById = async (id: number): Promise<Length | null> => {
  const result = await pool.query('SELECT * FROM lengths WHERE id = $1', [id]);
  return result.rows[0] || null;
};

/**
 * Crear nuevo largo
 */
export const createLength = async (data: LengthInput): Promise<Length> => {
  const { label, value_cm, display_order } = data;

  const result = await pool.query(
    `INSERT INTO lengths (label, value_cm, display_order)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [label, value_cm, display_order ?? 0]
  );

  return result.rows[0];
};

/**
 * Actualizar largo
 */
export const updateLength = async (
  id: number,
  data: Partial<LengthInput>
): Promise<Length | null> => {
  const { label, value_cm, display_order } = data;

  const result = await pool.query(
    `UPDATE lengths
     SET label = COALESCE($1, label),
         value_cm = COALESCE($2, value_cm),
         display_order = COALESCE($3, display_order),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $4
     RETURNING *`,
    [label, value_cm, display_order, id]
  );

  return result.rows[0] || null;
};

/**
 * Eliminar largo (si no tiene productos asociados)
 */
export const deleteLength = async (id: number): Promise<boolean> => {
  const checkProducts = await pool.query(
    'SELECT COUNT(*) FROM product_lengths WHERE length_id = $1',
    [id]
  );

  const productCount = parseInt(checkProducts.rows[0].count);

  if (productCount > 0) {
    throw new Error(`No se puede eliminar el largo porque tiene ${productCount} producto(s) asociado(s)`);
  }

  const result = await pool.query(
    'DELETE FROM lengths WHERE id = $1 RETURNING id',
    [id]
  );

  return result.rowCount ? result.rowCount > 0 : false;
};
