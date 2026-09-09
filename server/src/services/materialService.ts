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
  const blank = (v?: string) => (v == null || v.trim() === '' ? null : v);

  const result = await pool.query(
    `INSERT INTO materials (name, name_short, name_en, slug, description, display_order)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [name, blank(name_short) ?? name.slice(0, 24), blank(name_en), slug, blank(description), display_order ?? 0]
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
  // Solo se actualizan las columnas presentes en `data`. Así un campo
  // enviado vacío ('') se guarda como vacío (permite borrar el sello EN),
  // y un campo omitido conserva su valor actual.
  // '' o solo espacios en los campos opcionales -> NULL (mantiene la BD limpia
  // y el catálogo cae al siguiente nombre disponible).
  const nullIfBlank = (v: unknown) =>
    typeof v === 'string' && v.trim() === '' ? null : v ?? null;

  const cols: Record<string, unknown> = {};
  if ('name' in data) cols.name = data.name;
  if ('name_short' in data) cols.name_short = nullIfBlank(data.name_short);
  if ('name_en' in data) cols.name_en = nullIfBlank(data.name_en);
  if ('slug' in data) cols.slug = data.slug;
  if ('description' in data) cols.description = nullIfBlank(data.description);
  if ('display_order' in data) cols.display_order = data.display_order;

  const keys = Object.keys(cols);
  if (keys.length === 0) return getMaterialById(id);

  const setClauses = keys.map((k, i) => `${k} = $${i + 1}`);
  setClauses.push('updated_at = CURRENT_TIMESTAMP');
  const values = keys.map((k) => cols[k]);

  const result = await pool.query(
    `UPDATE materials SET ${setClauses.join(', ')} WHERE id = $${keys.length + 1} RETURNING *`,
    [...values, id]
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
