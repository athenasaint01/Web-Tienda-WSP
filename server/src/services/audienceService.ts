import pool from '../config/database';

export interface Audience {
  id: number;
  code?: string;
  name: string;
  slug: string;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface AudienceInput {
  name: string;
  slug: string;
  display_order?: number;
}

/**
 * Obtener todos los públicos
 */
export const getAllAudiences = async (): Promise<Audience[]> => {
  const result = await pool.query(
    'SELECT * FROM audiences ORDER BY display_order ASC, name ASC'
  );
  return result.rows;
};

/**
 * Obtener público por ID
 */
export const getAudienceById = async (id: number): Promise<Audience | null> => {
  const result = await pool.query('SELECT * FROM audiences WHERE id = $1', [id]);
  return result.rows[0] || null;
};

/**
 * Obtener público por slug
 */
export const getAudienceBySlug = async (slug: string): Promise<Audience | null> => {
  const result = await pool.query('SELECT * FROM audiences WHERE slug = $1', [slug]);
  return result.rows[0] || null;
};

/**
 * Crear nuevo público
 */
export const createAudience = async (data: AudienceInput): Promise<Audience> => {
  const { name, slug, display_order } = data;

  const result = await pool.query(
    `INSERT INTO audiences (name, slug, display_order)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [name, slug, display_order ?? 0]
  );

  return result.rows[0];
};

/**
 * Actualizar público
 */
export const updateAudience = async (
  id: number,
  data: Partial<AudienceInput>
): Promise<Audience | null> => {
  const { name, slug, display_order } = data;

  const result = await pool.query(
    `UPDATE audiences
     SET name = COALESCE($1, name),
         slug = COALESCE($2, slug),
         display_order = COALESCE($3, display_order),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $4
     RETURNING *`,
    [name, slug, display_order, id]
  );

  return result.rows[0] || null;
};

/**
 * Eliminar público (si no tiene productos asociados)
 */
export const deleteAudience = async (id: number): Promise<boolean> => {
  const checkProducts = await pool.query(
    'SELECT COUNT(*) FROM products WHERE audience_id = $1',
    [id]
  );

  const productCount = parseInt(checkProducts.rows[0].count);

  if (productCount > 0) {
    throw new Error(`No se puede eliminar el público porque tiene ${productCount} producto(s) asociado(s)`);
  }

  const result = await pool.query(
    'DELETE FROM audiences WHERE id = $1 RETURNING id',
    [id]
  );

  return result.rowCount ? result.rowCount > 0 : false;
};
