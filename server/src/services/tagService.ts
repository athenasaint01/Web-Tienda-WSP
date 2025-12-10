import pool from '../config/database';

export interface Tag {
  id: number;
  name: string;
  slug: string;
  created_at: Date;
  updated_at: Date;
}

export interface TagInput {
  name: string;
  slug: string;
}

/**
 * Obtener todos los tags
 */
export const getAllTags = async (): Promise<Tag[]> => {
  const result = await pool.query(
    'SELECT * FROM tags ORDER BY name ASC'
  );
  return result.rows;
};

/**
 * Obtener tag por ID
 */
export const getTagById = async (id: number): Promise<Tag | null> => {
  const result = await pool.query(
    'SELECT * FROM tags WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Obtener tag por slug
 */
export const getTagBySlug = async (slug: string): Promise<Tag | null> => {
  const result = await pool.query(
    'SELECT * FROM tags WHERE slug = $1',
    [slug]
  );
  return result.rows[0] || null;
};

/**
 * Crear nuevo tag
 */
export const createTag = async (data: TagInput): Promise<Tag> => {
  const { name, slug } = data;

  const result = await pool.query(
    `INSERT INTO tags (name, slug)
     VALUES ($1, $2)
     RETURNING *`,
    [name, slug]
  );

  return result.rows[0];
};

/**
 * Actualizar tag
 */
export const updateTag = async (
  id: number,
  data: Partial<TagInput>
): Promise<Tag | null> => {
  const { name, slug } = data;

  const result = await pool.query(
    `UPDATE tags
     SET name = COALESCE($1, name),
         slug = COALESCE($2, slug),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING *`,
    [name, slug, id]
  );

  return result.rows[0] || null;
};

/**
 * Eliminar tag (si no tiene productos asociados)
 */
export const deleteTag = async (id: number): Promise<boolean> => {
  // Verificar si hay productos con este tag
  const checkProducts = await pool.query(
    'SELECT COUNT(*) FROM product_tags WHERE tag_id = $1',
    [id]
  );

  const productCount = parseInt(checkProducts.rows[0].count);

  if (productCount > 0) {
    throw new Error(`No se puede eliminar el tag porque tiene ${productCount} producto(s) asociado(s)`);
  }

  const result = await pool.query(
    'DELETE FROM tags WHERE id = $1 RETURNING id',
    [id]
  );

  return result.rowCount ? result.rowCount > 0 : false;
};
