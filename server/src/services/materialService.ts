import pool from '../config/database';

export interface Material {
  id: number;
  code?: string;
  name: string;
  name_short?: string;
  name_en?: string;
  slug: string;
  description?: string;
  display_order?: number;
  created_at: Date;
  updated_at: Date;
}

export interface MaterialInput {
  name: string;
  name_short?: string;
  name_en?: string;
  slug: string;
  description?: string;
  display_order?: number;
}

/**
 * Obtener todos los materiales
 */
export const getAllMaterials = async (): Promise<Material[]> => {
  const result = await pool.query(
    'SELECT * FROM materials ORDER BY display_order ASC, name ASC'
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
  const { name, name_short, name_en, slug, description, display_order } = data;

  const result = await pool.query(
    `INSERT INTO materials (name, name_short, name_en, slug, description, display_order)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [name, name_short ?? name.slice(0, 24), name_en ?? null, slug, description, display_order ?? 0]
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
  const { name, name_short, name_en, slug, description, display_order } = data;

  const result = await pool.query(
    `UPDATE materials
     SET name = COALESCE($1, name),
         name_short = COALESCE($2, name_short),
         name_en = COALESCE($3, name_en),
         slug = COALESCE($4, slug),
         description = COALESCE($5, description),
         display_order = COALESCE($6, display_order),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $7
     RETURNING *`,
    [name, name_short, name_en, slug, description, display_order, id]
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
