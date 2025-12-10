import pool from '../config/database';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CategoryInput {
  name: string;
  slug: string;
  description?: string;
}

/**
 * Obtener todas las categorías
 */
export const getAllCategories = async (): Promise<Category[]> => {
  const result = await pool.query(
    'SELECT * FROM categories ORDER BY name ASC'
  );
  return result.rows;
};

/**
 * Obtener categoría por ID
 */
export const getCategoryById = async (id: number): Promise<Category | null> => {
  const result = await pool.query(
    'SELECT * FROM categories WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Obtener categoría por slug
 */
export const getCategoryBySlug = async (slug: string): Promise<Category | null> => {
  const result = await pool.query(
    'SELECT * FROM categories WHERE slug = $1',
    [slug]
  );
  return result.rows[0] || null;
};

/**
 * Crear nueva categoría
 */
export const createCategory = async (data: CategoryInput): Promise<Category> => {
  const { name, slug, description } = data;

  const result = await pool.query(
    `INSERT INTO categories (name, slug, description)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [name, slug, description]
  );

  return result.rows[0];
};

/**
 * Actualizar categoría
 */
export const updateCategory = async (
  id: number,
  data: Partial<CategoryInput>
): Promise<Category | null> => {
  const { name, slug, description } = data;

  const result = await pool.query(
    `UPDATE categories
     SET name = COALESCE($1, name),
         slug = COALESCE($2, slug),
         description = COALESCE($3, description),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $4
     RETURNING *`,
    [name, slug, description, id]
  );

  return result.rows[0] || null;
};

/**
 * Eliminar categoría (si no tiene productos asociados)
 */
export const deleteCategory = async (id: number): Promise<boolean> => {
  // Verificar si hay productos con esta categoría
  const checkProducts = await pool.query(
    'SELECT COUNT(*) FROM products WHERE category_id = $1',
    [id]
  );

  const productCount = parseInt(checkProducts.rows[0].count);

  if (productCount > 0) {
    throw new Error(`No se puede eliminar la categoría porque tiene ${productCount} producto(s) asociado(s)`);
  }

  const result = await pool.query(
    'DELETE FROM categories WHERE id = $1 RETURNING id',
    [id]
  );

  return result.rowCount ? result.rowCount > 0 : false;
};
