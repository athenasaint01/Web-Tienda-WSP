import pool from '../config/database';

export interface Material {
  id: number;
  name: string;
  slug: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface MaterialInput {
  name: string;
  slug: string;
  description?: string;
}

/**
 * Obtener todos los materiales
 */
export const getAllMaterials = async (): Promise<Material[]> => {
  const result = await pool.query(
    'SELECT * FROM materials ORDER BY name ASC'
  );
  return result.rows;
};

/**
 * Obtener material por ID
 */
export const getMaterialById = async (id: number): Promise<Material | null> => {
  const result = await pool.query(
    'SELECT * FROM materials WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Obtener material por slug
 */
export const getMaterialBySlug = async (slug: string): Promise<Material | null> => {
  const result = await pool.query(
    'SELECT * FROM materials WHERE slug = $1',
    [slug]
  );
  return result.rows[0] || null;
};

/**
 * Crear nuevo material
 */
export const createMaterial = async (data: MaterialInput): Promise<Material> => {
  const { name, slug, description } = data;

  const result = await pool.query(
    `INSERT INTO materials (name, slug, description)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [name, slug, description]
  );

  return result.rows[0];
};

/**
 * Actualizar material
 */
export const updateMaterial = async (
  id: number,
  data: Partial<MaterialInput>
): Promise<Material | null> => {
  const { name, slug, description } = data;

  const result = await pool.query(
    `UPDATE materials
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
 * Eliminar material (si no tiene productos asociados)
 */
export const deleteMaterial = async (id: number): Promise<boolean> => {
  // Verificar si hay productos con este material
  const checkProducts = await pool.query(
    'SELECT COUNT(*) FROM product_materials WHERE material_id = $1',
    [id]
  );

  const productCount = parseInt(checkProducts.rows[0].count);

  if (productCount > 0) {
    throw new Error(`No se puede eliminar el material porque tiene ${productCount} producto(s) asociado(s)`);
  }

  const result = await pool.query(
    'DELETE FROM materials WHERE id = $1 RETURNING id',
    [id]
  );

  return result.rowCount ? result.rowCount > 0 : false;
};
