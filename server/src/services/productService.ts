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
    audience,
    thickness,
    color,
    q,
    featured,
    is_active = true,
    sort = 'relevancia',
    page: rawPage = 1,
    limit: rawLimit = 50,
  } = filters;

  // Saneo de paginación: página >= 1, límite entre 1 y 100.
  const page = Math.max(1, Math.floor(Number(rawPage) || 1));
  const limit = Math.min(100, Math.max(1, Math.floor(Number(rawLimit) || 50)));

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

  // Filtro: público (uno o múltiples) - FK directa en products
  if (audience) {
    const audiences = Array.isArray(audience) ? audience : [audience];
    conditions.push(
      `EXISTS (
        SELECT 1 FROM audiences a
        WHERE a.id = p.audience_id AND a.slug = ANY($${paramCount++})
      )`
    );
    params.push(audiences);
  }

  // Filtro: grosor (uno o múltiples) - FK directa en products
  if (thickness) {
    const thicknesses = Array.isArray(thickness) ? thickness : [thickness];
    conditions.push(
      `EXISTS (
        SELECT 1 FROM thicknesses th
        WHERE th.id = p.thickness_id AND th.slug = ANY($${paramCount++})
      )`
    );
    params.push(thicknesses);
  }

  // Filtro: color (uno o múltiples) - N:M
  if (color) {
    const colors = Array.isArray(color) ? color : [color];
    conditions.push(
      `EXISTS (
        SELECT 1 FROM product_colors pc
        JOIN colors co ON pc.color_id = co.id
        WHERE pc.product_id = p.id AND co.slug = ANY($${paramCount++})
      )`
    );
    params.push(colors);
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

  // Ordenamiento.
  // Por defecto ('relevancia'): más antiguo primero -> el primer producto
  // creado sale arriba y los nuevos se agregan al final. `id` como
  // desempate para un orden estable si dos productos comparten timestamp.
  let orderBy = 'ORDER BY p.created_at ASC, p.id ASC';
  switch (sort) {
    case 'nombre-asc':
      orderBy = 'ORDER BY p.name ASC';
      break;
    case 'nombre-desc':
      orderBy = 'ORDER BY p.name DESC';
      break;
    case 'recent':
      orderBy = 'ORDER BY p.created_at DESC, p.id DESC';
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
      p.price::float8 AS price,
      p.discount_percent,
      p.sale_price::float8 AS sale_price,
      p.stock,
      CASE WHEN p.stock <= 0 THEN TRUE ELSE FALSE END as is_out_of_stock,
      (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) as image_url,
      (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = FALSE ORDER BY display_order ASC LIMIT 1) as image_url_2,
      COALESCE(
        (SELECT json_agg(json_build_object('name', m.name, 'slug', m.slug, 'name_short', m.name_short, 'name_en', m.name_en) ORDER BY m.display_order, m.name)
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
      ) as tags,
      (SELECT json_build_object('name', a.name, 'slug', a.slug)
         FROM audiences a WHERE a.id = p.audience_id) as audience,
      (SELECT json_build_object('name', th.name, 'slug', th.slug, 'level', th.level)
         FROM thicknesses th WHERE th.id = p.thickness_id) as thickness,
      COALESCE(
        (SELECT json_agg(json_build_object('name', co.name, 'slug', co.slug, 'hex', co.hex) ORDER BY co.display_order)
         FROM product_colors pc
         JOIN colors co ON pc.color_id = co.id
         WHERE pc.product_id = p.id),
        '[]'
      ) as colors,
      COALESCE(p.badge_labels, '{}') as badge_labels
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

  // sale_price siempre derivado del precio y el % (por si la columna quedó desincronizada)
  const data = dataResult.rows.map((row: any) => {
    const discountPercent = sanitizeDiscount(row.discount_percent);
    return {
      ...row,
      discount_percent: discountPercent,
      sale_price: computeSalePrice(row.price, discountPercent),
    };
  });

  return {
    data,
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

  return hydrateProductRelations(product);
};

// =============================================
// HELPER: cargar todas las relaciones de un producto
// =============================================
const hydrateProductRelations = async (product: any): Promise<ProductWithDetails> => {
  const [
    imagesResult,
    materialsResult,
    tagsResult,
    audienceResult,
    thicknessResult,
    sizesResult,
    lengthsResult,
    colorsResult,
  ] = await Promise.all([
    pool.query(
      `SELECT * FROM product_images WHERE product_id = $1 ORDER BY display_order, is_primary DESC`,
      [product.id]
    ),
    pool.query(
      `SELECT m.* FROM materials m
       JOIN product_materials pm ON m.id = pm.material_id
       WHERE pm.product_id = $1
       ORDER BY m.display_order, m.name`,
      [product.id]
    ),
    pool.query(
      `SELECT t.* FROM tags t
       JOIN product_tags pt ON t.id = pt.tag_id
       WHERE pt.product_id = $1
       ORDER BY t.name`,
      [product.id]
    ),
    product.audience_id
      ? pool.query(`SELECT * FROM audiences WHERE id = $1`, [product.audience_id])
      : Promise.resolve({ rows: [] as any[] }),
    product.thickness_id
      ? pool.query(`SELECT * FROM thicknesses WHERE id = $1`, [product.thickness_id])
      : Promise.resolve({ rows: [] as any[] }),
    pool.query(
      `SELECT s.* FROM sizes s
       JOIN product_sizes ps ON s.id = ps.size_id
       WHERE ps.product_id = $1
       ORDER BY s.display_order, s.ring_size`,
      [product.id]
    ),
    pool.query(
      `SELECT l.* FROM lengths l
       JOIN product_lengths pl ON l.id = pl.length_id
       WHERE pl.product_id = $1
       ORDER BY l.display_order, l.value_cm`,
      [product.id]
    ),
    pool.query(
      `SELECT co.*, pc.is_primary AS product_is_primary FROM colors co
       JOIN product_colors pc ON co.id = pc.color_id
       WHERE pc.product_id = $1
       ORDER BY pc.is_primary DESC, co.display_order`,
      [product.id]
    ),
  ]);

  // pg devuelve NUMERIC como string -> normalizar a number | null
  const price = product.price != null ? parseFloat(product.price) : null;
  const discountPercent = sanitizeDiscount(product.discount_percent);

  return {
    ...product,
    price,
    discount_percent: discountPercent,
    // sale_price siempre derivado del precio y el % (nunca de la columna)
    sale_price: computeSalePrice(price, discountPercent),
    images: imagesResult.rows,
    materials: materialsResult.rows,
    tags: tagsResult.rows,
    audience: audienceResult.rows[0] || null,
    thickness: thicknessResult.rows[0] || null,
    sizes: sizesResult.rows,
    lengths: lengthsResult.rows,
    colors: colorsResult.rows,
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

  return hydrateProductRelations(product);
};

// =============================================
// HELPER: normaliza el porcentaje de descuento a un entero 0-95, o null.
export const sanitizeDiscount = (pct: number | null | undefined): number | null => {
  if (pct == null || isNaN(pct)) return null;
  const n = Math.round(pct);
  if (n <= 0) return null;
  if (n > 95) return 95;
  return n;
};

// HELPER: precio de oferta derivado del precio y el % de descuento.
export const computeSalePrice = (
  price: number | null | undefined,
  discountPercent: number | null | undefined
): number | null => {
  if (price == null || discountPercent == null || discountPercent <= 0) return null;
  return Math.round(price * (1 - discountPercent / 100) * 100) / 100;
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
    const price = data.price ?? null;
    const discountPercent = sanitizeDiscount(data.discount_percent);
    const salePrice = computeSalePrice(price, discountPercent);

    // 1. Crear producto
    const productResult = await client.query(
      `INSERT INTO products (slug, name, category_id, audience_id, thickness_id, description, featured, price, discount_percent, sale_price, stock, low_stock_threshold, wa_template, badge_labels)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        normalizedSlug,
        data.name,
        data.category_id,
        data.audience_id ?? null,
        data.thickness_id ?? null,
        data.description,
        data.featured || false,
        price,
        discountPercent,
        salePrice,
        data.stock !== undefined ? data.stock : 0,
        data.low_stock_threshold !== undefined ? data.low_stock_threshold : 5,
        data.wa_template,
        data.badge_labels || [],
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

    // 5. Agregar tallas
    if (data.size_ids && data.size_ids.length > 0) {
      for (const sizeId of data.size_ids) {
        await client.query(
          `INSERT INTO product_sizes (product_id, size_id) VALUES ($1, $2)`,
          [product.id, sizeId]
        );
      }
    }

    // 6. Agregar largos
    if (data.length_ids && data.length_ids.length > 0) {
      for (const lengthId of data.length_ids) {
        await client.query(
          `INSERT INTO product_lengths (product_id, length_id) VALUES ($1, $2)`,
          [product.id, lengthId]
        );
      }
    }

    // 7. Agregar colores (el primero se marca como principal)
    if (data.color_ids && data.color_ids.length > 0) {
      for (let i = 0; i < data.color_ids.length; i++) {
        await client.query(
          `INSERT INTO product_colors (product_id, color_id, is_primary) VALUES ($1, $2, $3)`,
          [product.id, data.color_ids[i], i === 0]
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
    const { material_ids, tag_ids, size_ids, length_ids, color_ids, ...productData } = data;

    // Normalizar slug si está presente
    if (productData.slug) {
      productData.slug = productData.slug.toLowerCase().replace(/\s+/g, '-');
    }

    // Si cambia el precio o el % de descuento, recalcular discount_percent
    // (normalizado) y sale_price (derivado) para mantener todo consistente.
    if (productData.price !== undefined || productData.discount_percent !== undefined) {
      const currentRow = await client.query(
        'SELECT price, discount_percent FROM products WHERE id = $1',
        [id]
      );
      const cur = currentRow.rows[0] || {};
      const currentPrice = cur.price != null ? parseFloat(cur.price) : null;
      const currentPct = cur.discount_percent != null ? Number(cur.discount_percent) : null;

      const effectivePrice = productData.price !== undefined ? productData.price : currentPrice;
      const effectivePct =
        productData.discount_percent !== undefined ? productData.discount_percent : currentPct;

      const pct = sanitizeDiscount(effectivePrice != null ? effectivePct : null);
      productData.discount_percent = pct;
      (productData as any).sale_price = computeSalePrice(effectivePrice, pct);
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

    // Actualizar tallas si se proporcionaron
    if (size_ids !== undefined) {
      await client.query('DELETE FROM product_sizes WHERE product_id = $1', [id]);

      if (size_ids.length > 0) {
        const sizeValues = size_ids.map((_id: number, i: number) => `($1, $${i + 2})`).join(', ');
        await client.query(
          `INSERT INTO product_sizes (product_id, size_id) VALUES ${sizeValues}`,
          [id, ...size_ids]
        );
      }
    }

    // Actualizar largos si se proporcionaron
    if (length_ids !== undefined) {
      await client.query('DELETE FROM product_lengths WHERE product_id = $1', [id]);

      if (length_ids.length > 0) {
        const lengthValues = length_ids.map((_id: number, i: number) => `($1, $${i + 2})`).join(', ');
        await client.query(
          `INSERT INTO product_lengths (product_id, length_id) VALUES ${lengthValues}`,
          [id, ...length_ids]
        );
      }
    }

    // Actualizar colores si se proporcionaron (el primero = principal)
    if (color_ids !== undefined) {
      await client.query('DELETE FROM product_colors WHERE product_id = $1', [id]);

      if (color_ids.length > 0) {
        const colorValues = color_ids
          .map((_id: number, i: number) => `($1, $${i + 2}, ${i === 0 ? 'TRUE' : 'FALSE'})`)
          .join(', ');
        await client.query(
          `INSERT INTO product_colors (product_id, color_id, is_primary) VALUES ${colorValues}`,
          [id, ...color_ids]
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
// GARANTIZAR IMAGEN PRINCIPAL
// Si el producto tiene imágenes pero ninguna is_primary, marca la primera
// (por display_order) como principal. Si tiene más de una, deja solo una.
// =============================================
export const ensurePrimaryImage = async (productId: number): Promise<void> => {
  const primaries = await pool.query(
    'SELECT id FROM product_images WHERE product_id = $1 AND is_primary = TRUE ORDER BY display_order',
    [productId]
  );

  if (primaries.rows.length === 1) return; // ya está bien

  if (primaries.rows.length === 0) {
    // Ninguna principal -> marcar la primera imagen que exista
    await pool.query(
      `UPDATE product_images SET is_primary = TRUE
       WHERE id = (
         SELECT id FROM product_images WHERE product_id = $1
         ORDER BY display_order, id LIMIT 1
       )`,
      [productId]
    );
    return;
  }

  // Más de una principal -> dejar solo la de menor display_order
  await pool.query(
    `UPDATE product_images SET is_primary = FALSE
     WHERE product_id = $1 AND id <> (
       SELECT id FROM product_images
       WHERE product_id = $1 AND is_primary = TRUE
       ORDER BY display_order, id LIMIT 1
     )`,
    [productId]
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

// =============================================
// MÉTRICAS DE CONSULTA
// =============================================
export type ProductMetricKind = 'view' | 'wa_click';

/**
 * Suma 1 al contador indicado del producto. No lanza si el id no existe
 * (devuelve false); es un endpoint público best-effort.
 */
export const incrementProductMetric = async (
  id: number,
  kind: ProductMetricKind
): Promise<boolean> => {
  const column = kind === 'wa_click' ? 'wa_click_count' : 'view_count';
  const result = await pool.query(
    `UPDATE products SET ${column} = ${column} + 1 WHERE id = $1 AND is_active = TRUE RETURNING id`,
    [id]
  );
  return result.rowCount !== null && result.rowCount > 0;
};

/**
 * Ranking de productos más consultados. Ordena por clics a WhatsApp
 * (intención real) y desempata por vistas de ficha.
 */
export const getTopConsultedProducts = async (limit = 8) => {
  const safeLimit = Math.min(50, Math.max(1, Math.floor(limit) || 8));
  const result = await pool.query(
    `SELECT
       p.id, p.name, p.slug, p.view_count, p.wa_click_count, p.stock,
       (SELECT pi.image_url FROM product_images pi
         WHERE pi.product_id = p.id
         ORDER BY pi.is_primary DESC, pi.id ASC LIMIT 1) AS image_url
     FROM products p
     WHERE p.is_active = TRUE AND (p.view_count > 0 OR p.wa_click_count > 0)
     ORDER BY p.wa_click_count DESC, p.view_count DESC, p.name ASC
     LIMIT $1`,
    [safeLimit]
  );
  return result.rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    view_count: r.view_count,
    wa_click_count: r.wa_click_count,
    stock: r.stock,
    image_url: r.image_url ?? null,
  }));
};
