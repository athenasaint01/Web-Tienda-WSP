import pool from '../config/database';

export interface Collection {
  id: number;
  category_id: number;
  title: string;
  description?: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CollectionWithCategory extends Collection {
  category_name: string;
  category_slug: string;
}

export interface CollectionInput {
  category_id: number;
  title: string;
  description?: string;
  image_url: string;
  display_order?: number;
  is_active?: boolean;
}

/**
 * Obtener todas las colecciones con información de categoría
 */
export const getAllCollections = async (): Promise<CollectionWithCategory[]> => {
  const result = await pool.query(
    `SELECT
      c.*,
      cat.name AS category_name,
      cat.slug AS category_slug
     FROM collections c
     INNER JOIN categories cat ON c.category_id = cat.id
     ORDER BY c.display_order ASC, c.created_at DESC`
  );
  return result.rows;
};

/**
 * Obtener solo colecciones activas (para mostrar en el Home)
 */
export const getActiveCollections = async (): Promise<CollectionWithCategory[]> => {
  const result = await pool.query(
    `SELECT
      c.*,
      cat.name AS category_name,
      cat.slug AS category_slug
     FROM collections c
     INNER JOIN categories cat ON c.category_id = cat.id
     WHERE c.is_active = TRUE
     ORDER BY c.display_order ASC`
  );
  return result.rows;
};

/**
 * Obtener colección por ID
 */
export const getCollectionById = async (id: number): Promise<CollectionWithCategory | null> => {
  const result = await pool.query(
    `SELECT
      c.*,
      cat.name AS category_name,
      cat.slug AS category_slug
     FROM collections c
     INNER JOIN categories cat ON c.category_id = cat.id
     WHERE c.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Obtener colección por slug de categoría
 */
export const getCollectionByCategorySlug = async (slug: string): Promise<CollectionWithCategory | null> => {
  const result = await pool.query(
    `SELECT
      c.*,
      cat.name AS category_name,
      cat.slug AS category_slug
     FROM collections c
     INNER JOIN categories cat ON c.category_id = cat.id
     WHERE cat.slug = $1 AND c.is_active = TRUE`,
    [slug]
  );
  return result.rows[0] || null;
};

/**
 * Crear nueva colección
 */
export const createCollection = async (data: CollectionInput): Promise<Collection> => {
  const { category_id, title, description, image_url, display_order = 0, is_active = true } = data;

  const result = await pool.query(
    `INSERT INTO collections (category_id, title, description, image_url, display_order, is_active)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [category_id, title, description, image_url, display_order, is_active]
  );

  return result.rows[0];
};

/**
 * Actualizar colección
 */
export const updateCollection = async (
  id: number,
  data: Partial<CollectionInput>
): Promise<Collection | null> => {
  const { category_id, title, description, image_url, display_order, is_active } = data;

  const result = await pool.query(
    `UPDATE collections
     SET category_id = COALESCE($1, category_id),
         title = COALESCE($2, title),
         description = COALESCE($3, description),
         image_url = COALESCE($4, image_url),
         display_order = COALESCE($5, display_order),
         is_active = COALESCE($6, is_active),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $7
     RETURNING *`,
    [category_id, title, description, image_url, display_order, is_active, id]
  );

  return result.rows[0] || null;
};

/**
 * Eliminar colección
 */
export const deleteCollection = async (id: number): Promise<boolean> => {
  const result = await pool.query(
    'DELETE FROM collections WHERE id = $1 RETURNING id',
    [id]
  );

  return result.rowCount ? result.rowCount > 0 : false;
};

/**
 * Reordenar colecciones (actualizar display_order de múltiples)
 */
export const reorderCollections = async (orders: { id: number; display_order: number }[]): Promise<void> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const { id, display_order } of orders) {
      await client.query(
        'UPDATE collections SET display_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [display_order, id]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
