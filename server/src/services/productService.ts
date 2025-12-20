import pool from '../config/database';
import {
  Product,
  ProductWithDetails,
  ProductListItem,
  CreateProductDTO,
  UpdateProductDTO,
  ProductFilters,
  PaginatedResponse,
} from '../types/models';

// =============================================
// OBTENER TODOS LOS PRODUCTOS (CON FILTROS)
// =============================================
export const getAllProducts = async (
  filters: ProductFilters = {}
): Promise<PaginatedResponse<ProductListItem>> => {
  const {
    category,
    material,
    tag,
    q,
    featured,
    is_active = true,
    sort = 'relevancia',
    page = 1,
    limit = 50,
  } = filters;

  // Construir WHERE dinámicamente
  const conditions: string[] = [];
  const params: any[] = [];
  let paramCount = 1;

  // Filtro: is_active
  conditions.push(`p.is_active = $${paramCount++}`);
  params.push(is_active);

  // Filtro: featured
  if (featured !== undefined) {
    conditions.push(`p.featured = $${paramCount++}`);
    params.push(featured);
  }

  // Filtro: categoría (uno o múltiples)
  if (category) {
    const categories = Array.isArray(category) ? category : [category];
    conditions.push(`c.slug = ANY($${paramCount++})`);
    params.push(categories);
  }

  // Filtro: material (uno o múltiples)
  if (material) {
    const materials = Array.isArray(material) ? material : [material];
    conditions.push(
      `EXISTS (
        SELECT 1 FROM product_materials pm
        JOIN materials m ON pm.material_id = m.id
        WHERE pm.product_id = p.id AND m.slug = ANY($${paramCount++})
      )`
    );
    params.push(materials);
  }

  // Filtro: tag (uno o múltiples)
  if (tag) {
    const tags = Array.isArray(tag) ? tag : [tag];
    conditions.push(
      `EXISTS (
        SELECT 1 FROM product_tags pt
        JOIN tags t ON pt.tag_id = t.id
        WHERE pt.product_id = p.id AND t.slug = ANY($${paramCount++})
      )`
    );
    params.push(tags);
  }

  // Filtro: búsqueda por texto
  if (q) {
    conditions.push(
      `(
        LOWER(p.name) LIKE $${paramCount} OR
        LOWER(p.description) LIKE $${paramCount}
      )`
    );
    params.push(`%${q.toLowerCase()}%`);
    paramCount++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Ordenamiento
  let orderBy = 'ORDER BY p.featured DESC, p.created_at DESC';
  switch (sort) {
    case 'nombre-asc':
      orderBy = 'ORDER BY p.name ASC';
      break;
    case 'nombre-desc':
      orderBy = 'ORDER BY p.name DESC';
      break;
    case 'recent':
      orderBy = 'ORDER BY p.created_at DESC';
      break;
  }

  // Paginación
  const offset = (page - 1) * limit;
  params.push(limit, offset);

  // Query principal
  const query = `
    SELECT
      p.id,
      p.slug,
      p.name,
      c.name as category,
      c.slug as category_slug,
      p.description,
      p.featured,
      p.stock,
      CASE WHEN p.stock <= 0 THEN TRUE ELSE FALSE END as is_out_of_stock,
      (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) as image_url,
      COALESCE(
        (SELECT json_agg(json_build_object('name', m.name, 'slug', m.slug) ORDER BY m.name)
         FROM product_materials pm
         JOIN materials m ON pm.material_id = m.id
         WHERE pm.product_id = p.id),
        '[]'
      ) as materials,
      COALESCE(
        (SELECT json_agg(json_build_object('name', t.name, 'slug', t.slug) ORDER BY t.name)
         FROM product_tags pt
         JOIN tags t ON pt.tag_id = t.id
         WHERE pt.product_id = p.id),
        '[]'
      ) as tags
    FROM products p
    JOIN categories c ON p.category_id = c.id
    ${whereClause}
    ${orderBy}
    LIMIT $${paramCount++} OFFSET $${paramCount++}
  `;

  // Query para contar total
  const countQuery = `
    SELECT COUNT(DISTINCT p.id) as total
    FROM products p
    JOIN categories c ON p.category_id = c.id
    ${whereClause}
  `;

  const [dataResult, countResult] = await Promise.all([
    pool.query(query, params),
    pool.query(countQuery, params.slice(0, paramCount - 3)),
  ]);

  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / limit);

  return {
    data: dataResult.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

// =============================================
// OBTENER PRODUCTO POR SLUG (CON DETALLES COMPLETOS)
// =============================================
export const getProductBySlug = async (slug: string): Promise<ProductWithDetails | null> => {
  const query = `
    SELECT
      p.*,
      row_to_json(c.*) as category
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE p.slug = $1 AND p.is_active = TRUE
  `;

  const result = await pool.query(query, [slug]);

  if (result.rows.length === 0) {
    return null;
  }

  const product = result.rows[0];

  // Obtener imágenes
  const imagesResult = await pool.query(
    `SELECT * FROM product_images WHERE product_id = $1 ORDER BY display_order, is_primary DESC`,
    [product.id]
  );

  // Obtener materiales
  const materialsResult = await pool.query(
    `SELECT m.* FROM materials m
     JOIN product_materials pm ON m.id = pm.material_id
     WHERE pm.product_id = $1
     ORDER BY m.name`,
    [product.id]
  );

  // Obtener tags
  const tagsResult = await pool.query(
    `SELECT t.* FROM tags t
     JOIN product_tags pt ON t.id = pt.tag_id
     WHERE pt.product_id = $1
     ORDER BY t.name`,
    [product.id]
  );

  return {
    ...product,
    images: imagesResult.rows,
    materials: materialsResult.rows,
    tags: tagsResult.rows,
  };
};

// =============================================
// OBTENER PRODUCTO POR ID
// =============================================
export const getProductById = async (id: number): Promise<ProductWithDetails | null> => {
  const query = `
    SELECT
      p.*,
      row_to_json(c.*) as category
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE p.id = $1
  `;

  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    return null;
  }

  const product = result.rows[0];

  // Obtener relaciones
  const [imagesResult, materialsResult, tagsResult] = await Promise.all([
    pool.query(
      `SELECT * FROM product_images WHERE product_id = $1 ORDER BY display_order, is_primary DESC`,
      [product.id]
    ),
    pool.query(
      `SELECT m.* FROM materials m
       JOIN product_materials pm ON m.id = pm.material_id
       WHERE pm.product_id = $1 ORDER BY m.name`,
      [product.id]
    ),
    pool.query(
      `SELECT t.* FROM tags t
       JOIN product_tags pt ON t.id = pt.tag_id
       WHERE pt.product_id = $1 ORDER BY t.name`,
      [product.id]
    ),
  ]);

  return {
    ...product,
    images: imagesResult.rows,
    materials: materialsResult.rows,
    tags: tagsResult.rows,
  };
};

// =============================================
// CREAR PRODUCTO
// =============================================
export const createProduct = async (data: CreateProductDTO): Promise<Product> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Normalizar slug: convertir a minúsculas y reemplazar espacios por guiones
    const normalizedSlug = data.slug.toLowerCase().replace(/\s+/g, '-');

    // 1. Crear producto
    const productResult = await client.query(
      `INSERT INTO products (slug, name, category_id, description, featured, stock, low_stock_threshold, wa_template)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        normalizedSlug,
        data.name,
        data.category_id,
        data.description,
        data.featured || false,
        data.stock !== undefined ? data.stock : 0,
        data.low_stock_threshold !== undefined ? data.low_stock_threshold : 5,
        data.wa_template
      ]
    );

    const product = productResult.rows[0];

    // 2. Agregar imágenes
    if (data.images && data.images.length > 0) {
      for (let i = 0; i < data.images.length; i++) {
        const img = data.images[i];
        await client.query(
          `INSERT INTO product_images (product_id, image_url, display_order, is_primary, alt_text)
           VALUES ($1, $2, $3, $4, $5)`,
          [product.id, img.url, i + 1, img.is_primary || i === 0, img.alt_text]
        );
      }
    }

    // 3. Agregar materiales
    if (data.material_ids && data.material_ids.length > 0) {
      for (const materialId of data.material_ids) {
        await client.query(
          `INSERT INTO product_materials (product_id, material_id) VALUES ($1, $2)`,
          [product.id, materialId]
        );
      }
    }

    // 4. Agregar tags
    if (data.tag_ids && data.tag_ids.length > 0) {
      for (const tagId of data.tag_ids) {
        await client.query(
          `INSERT INTO product_tags (product_id, tag_id) VALUES ($1, $2)`,
          [product.id, tagId]
        );
      }
    }

    await client.query('COMMIT');
    return product;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// =============================================
// ACTUALIZAR PRODUCTO
// =============================================
export const updateProduct = async (id: number, data: UpdateProductDTO): Promise<Product | null> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Separar campos de producto de las relaciones
    const { material_ids, tag_ids, ...productData } = data;

    // Normalizar slug si está presente
    if (productData.slug) {
      productData.slug = productData.slug.toLowerCase().replace(/\s+/g, '-');
    }

    // Actualizar campos básicos del producto
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(productData).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramCount++}`);
        values.push(value);
      }
    });

    if (fields.length > 0) {
      values.push(id);
      const query = `
        UPDATE products
        SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
        RETURNING *
      `;
      await client.query(query, values);
    }

    // Actualizar materiales si se proporcionaron
    if (material_ids !== undefined) {
      await client.query('DELETE FROM product_materials WHERE product_id = $1', [id]);

      if (material_ids.length > 0) {
        const materialValues = material_ids.map((_matId: number, i: number) =>
          `($1, $${i + 2})`
        ).join(', ');

        await client.query(
          `INSERT INTO product_materials (product_id, material_id) VALUES ${materialValues}`,
          [id, ...material_ids]
        );
      }
    }

    // Actualizar tags si se proporcionaron
    if (tag_ids !== undefined) {
      await client.query('DELETE FROM product_tags WHERE product_id = $1', [id]);

      if (tag_ids.length > 0) {
        const tagValues = tag_ids.map((_tagId: number, i: number) =>
          `($1, $${i + 2})`
        ).join(', ');

        await client.query(
          `INSERT INTO product_tags (product_id, tag_id) VALUES ${tagValues}`,
          [id, ...tag_ids]
        );
      }
    }

    await client.query('COMMIT');

    // Retornar producto actualizado
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    return result.rows[0] || null;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// =============================================
// AGREGAR IMAGEN A PRODUCTO EXISTENTE
// =============================================
export const addProductImage = async (
  productId: number,
  imageData: { url: string; is_primary?: boolean; alt_text?: string }
): Promise<void> => {
  // Get current max display_order
  const maxOrderResult = await pool.query(
    'SELECT COALESCE(MAX(display_order), 0) as max_order FROM product_images WHERE product_id = $1',
    [productId]
  );
  const nextOrder = maxOrderResult.rows[0].max_order + 1;

  await pool.query(
    `INSERT INTO product_images (product_id, image_url, display_order, is_primary, alt_text)
     VALUES ($1, $2, $3, $4, $5)`,
    [productId, imageData.url, nextOrder, imageData.is_primary || false, imageData.alt_text || null]
  );
};

// =============================================
// ELIMINAR IMAGEN DE PRODUCTO POR URL
// =============================================
export const deleteProductImageByUrl = async (
  productId: number,
  imageUrl: string
): Promise<void> => {
  await pool.query(
    'DELETE FROM product_images WHERE product_id = $1 AND image_url = $2',
    [productId, imageUrl]
  );
};

// =============================================
// ELIMINAR IMAGEN DE PRODUCTO POR ID
// =============================================
export const deleteProductImageById = async (imageId: number): Promise<void> => {
  await pool.query('DELETE FROM product_images WHERE id = $1', [imageId]);
};

// =============================================
// ELIMINAR PRODUCTO (SOFT DELETE)
// =============================================
export const deleteProduct = async (id: number): Promise<boolean> => {
  const result = await pool.query(
    'UPDATE products SET is_active = FALSE WHERE id = $1 RETURNING id',
    [id]
  );
  return result.rowCount !== null && result.rowCount > 0;
};

// =============================================
// ELIMINAR PRODUCTO PERMANENTEMENTE
// =============================================
export const hardDeleteProduct = async (id: number): Promise<boolean> => {
  const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
  return result.rowCount !== null && result.rowCount > 0;
};
