import pool from '../config/database';
import {
  Product,
  ProductWithDetails,
  ProductListItem,
  CreateProductDTO,
  UpdateProductDTO,
  ProductFilters,
  PaginatedResponse,
  ProductVariant,
  ProductVariantWithAttrs,
  VariantInputDTO,
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
    case 'precio-asc':
      // El precio efectivo (con descuento) manda; NULLS al final.
      orderBy = 'ORDER BY COALESCE(p.sale_price, p.price) ASC NULLS LAST, p.id ASC';
      break;
    case 'precio-desc':
      orderBy = 'ORDER BY COALESCE(p.sale_price, p.price) DESC NULLS LAST, p.id ASC';
      break;
  }

  // Paginación
  const offset = (page - 1) * limit;
  params.push(limit, offset);

  // Query principal
  const query = `
    SELECT
      p.id,
      p.sku,
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
      COALESCE(p.badge_labels, '{}') as badge_labels,
      p.has_variants
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

  return hydrateProductRelations(product, { includeInactiveVariants: false });
};

// =============================================
// HELPER: cargar todas las relaciones de un producto
// =============================================
// `includeInactiveVariants`: el admin necesita ver también las variantes
// desactivadas (para poder reactivarlas); el catálogo público solo debe
// ver las activas. Default false = comportamiento público/seguro.
const hydrateProductRelations = async (
  product: any,
  opts: { includeInactiveVariants?: boolean } = {}
): Promise<ProductWithDetails> => {
  const { includeInactiveVariants = false } = opts;
  const [
    imagesResult,
    materialsResult,
    tagsResult,
    audienceResult,
    thicknessResult,
    sizesResult,
    lengthsResult,
    colorsResult,
    variantsResult,
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
    product.has_variants
      ? pool.query(
          `SELECT
             pv.*,
             row_to_json(co.*) AS color,
             row_to_json(s.*)  AS size,
             row_to_json(l.*)  AS length
           FROM product_variants pv
           LEFT JOIN colors  co ON co.id = pv.color_id
           LEFT JOIN sizes   s  ON s.id  = pv.size_id
           LEFT JOIN lengths l  ON l.id  = pv.length_id
           WHERE pv.product_id = $1 ${includeInactiveVariants ? '' : 'AND pv.is_active = TRUE'}
           ORDER BY pv.display_order, pv.id`,
          [product.id]
        )
      : Promise.resolve({ rows: [] as any[] }),
  ]);

  // pg devuelve NUMERIC como string -> normalizar a number | null
  const price = product.price != null ? parseFloat(product.price) : null;
  const discountPercent = sanitizeDiscount(product.discount_percent);

  // Variantes: normalizar NUMERIC->number igual que se hace con el producto.
  const variants = variantsResult.rows.map((v: any) => {
    const vPrice = v.price != null ? parseFloat(v.price) : null;
    const vDiscount = sanitizeDiscount(v.discount_percent);
    return {
      ...v,
      price: vPrice,
      discount_percent: vDiscount,
      sale_price: computeSalePrice(vPrice, vDiscount),
    };
  });

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
    variants,
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

  // Vista admin: incluye también las variantes desactivadas (para poder
  // reactivarlas desde el formulario).
  return hydrateProductRelations(product, { includeInactiveVariants: true });
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

// HELPER: siguiente SKU autogenerado ('ALH-000001', 'ALH-000002', ...).
// Usa una secuencia propia (product_sku_seq) para pedir "el siguiente" de
// forma atómica, sin condición de carrera entre creaciones concurrentes.
export const generateProductSku = async (client: { query: typeof pool.query } = pool): Promise<string> => {
  const { rows } = await client.query(`SELECT nextval('product_sku_seq') AS n`);
  return `ALH-${String(rows[0].n).padStart(6, '0')}`;
};

// =============================================
// VARIANTES DE PRODUCTO (precio/descuento/stock propios por combinación
// de color/talla/largo)
// =============================================

// HELPER: SKU de variante determinístico a partir del SKU del producto
// y los slugs/códigos de su combinación. Ej: 'ALH-000004-DOR-T7'.
// Puro (no toca la BD) para poder probarlo y reutilizarlo fácil.
export const generateVariantSku = (
  productSku: string,
  combo: { colorSlug?: string | null; sizeCode?: string | null; lengthCode?: string | null }
): string => {
  const parts: string[] = [];
  if (combo.colorSlug) parts.push(combo.colorSlug.replace(/-/g, '').slice(0, 3).toUpperCase());
  if (combo.sizeCode) parts.push(combo.sizeCode.replace(/[^0-9A-Za-z]/g, '').toUpperCase());
  if (combo.lengthCode) parts.push(combo.lengthCode.replace(/[^0-9A-Za-z]/g, '').toUpperCase());
  return parts.length ? `${productSku}-${parts.join('-')}` : productSku;
};

// Normaliza una fila de product_variants (NUMERIC -> number, deriva sale_price).
const normalizeVariantRow = (v: any): ProductVariant => {
  const price = v.price != null ? parseFloat(v.price) : null;
  const discountPercent = sanitizeDiscount(v.discount_percent);
  return {
    ...v,
    price,
    discount_percent: discountPercent,
    sale_price: computeSalePrice(price, discountPercent),
  };
};

/**
 * Lista las variantes de un producto (con sus atributos de catálogo
 * resueltos). `includeInactive` para el admin; el público solo ve activas.
 */
export const listProductVariants = async (
  productId: number,
  opts: { includeInactive?: boolean } = {}
): Promise<ProductVariantWithAttrs[]> => {
  const { includeInactive = false } = opts;
  const result = await pool.query(
    `SELECT
       pv.*,
       row_to_json(co.*) AS color,
       row_to_json(s.*)  AS size,
       row_to_json(l.*)  AS length
     FROM product_variants pv
     LEFT JOIN colors  co ON co.id = pv.color_id
     LEFT JOIN sizes   s  ON s.id  = pv.size_id
     LEFT JOIN lengths l  ON l.id  = pv.length_id
     WHERE pv.product_id = $1 ${includeInactive ? '' : 'AND pv.is_active = TRUE'}
     ORDER BY pv.display_order, pv.id`,
    [productId]
  );
  return result.rows.map(normalizeVariantRow) as ProductVariantWithAttrs[];
};

export const getVariantById = async (variantId: number): Promise<ProductVariant | null> => {
  const result = await pool.query('SELECT * FROM product_variants WHERE id = $1', [variantId]);
  return result.rows[0] ? normalizeVariantRow(result.rows[0]) : null;
};

/**
 * Reemplaza el conjunto de variantes de un producto dentro de una
 * transacción existente. NO usa el patrón "delete-all-then-reinsert" de
 * los demás pivots N:M: una variante tiene stock/precio reales y un `id`
 * estable al que pueden apuntar pedidos ya confirmados
 * (order_items.variant_id) — recrearla con un id nuevo rompería esa
 * trazabilidad en silencio. En su lugar:
 *   - variantes del payload con `id` existente -> UPDATE
 *   - variantes del payload sin `id` -> INSERT
 *   - variantes en BD que ya NO vienen en el payload -> se DESACTIVAN
 *     (is_active = false), nunca se borran duro.
 */
const replaceProductVariants = async (
  client: { query: typeof pool.query },
  productId: number,
  productSku: string,
  variants: VariantInputDTO[]
): Promise<void> => {
  const existing = await client.query(
    'SELECT id FROM product_variants WHERE product_id = $1',
    [productId]
  );
  const existingIds = new Set(existing.rows.map((r: any) => r.id));
  const keepIds = new Set(variants.filter((v) => v.id != null).map((v) => v.id));

  const toDeactivate = [...existingIds].filter((id) => !keepIds.has(id));
  if (toDeactivate.length > 0) {
    await client.query(
      'UPDATE product_variants SET is_active = FALSE WHERE id = ANY($1)',
      [toDeactivate]
    );
  }

  // Resolver en batch los slugs/códigos de color/talla/largo usados en el
  // payload, para poder generar el sufijo del SKU sin una query por fila.
  const colorIds = [...new Set(variants.map((v) => v.color_id).filter((x): x is number => x != null))];
  const sizeIds = [...new Set(variants.map((v) => v.size_id).filter((x): x is number => x != null))];
  const lengthIds = [...new Set(variants.map((v) => v.length_id).filter((x): x is number => x != null))];

  const [colorRows, sizeRows, lengthRows] = await Promise.all([
    colorIds.length ? client.query('SELECT id, slug FROM colors WHERE id = ANY($1)', [colorIds]) : Promise.resolve({ rows: [] as any[] }),
    sizeIds.length ? client.query('SELECT id, code FROM sizes WHERE id = ANY($1)', [sizeIds]) : Promise.resolve({ rows: [] as any[] }),
    lengthIds.length ? client.query('SELECT id, code FROM lengths WHERE id = ANY($1)', [lengthIds]) : Promise.resolve({ rows: [] as any[] }),
  ]);
  const colorSlugById = new Map(colorRows.rows.map((r: any) => [r.id, r.slug]));
  const sizeCodeById = new Map(sizeRows.rows.map((r: any) => [r.id, r.code]));
  const lengthCodeById = new Map(lengthRows.rows.map((r: any) => [r.id, r.code]));

  for (const v of variants) {
    const discountPct = sanitizeDiscount(v.discount_percent);
    const salePrice = computeSalePrice(v.price ?? null, discountPct);
    const sku =
      v.sku?.trim() ||
      generateVariantSku(productSku, {
        colorSlug: v.color_id != null ? colorSlugById.get(v.color_id) : null,
        sizeCode: v.size_id != null ? sizeCodeById.get(v.size_id) : null,
        lengthCode: v.length_id != null ? lengthCodeById.get(v.length_id) : null,
      });

    if (v.id != null && existingIds.has(v.id)) {
      await client.query(
        `UPDATE product_variants
         SET color_id = $1, size_id = $2, length_id = $3, price = $4, discount_percent = $5,
             sale_price = $6, stock = $7, low_stock_threshold = $8, is_active = $9,
             display_order = $10, sku = $11, updated_at = CURRENT_TIMESTAMP
         WHERE id = $12 AND product_id = $13`,
        [
          v.color_id ?? null, v.size_id ?? null, v.length_id ?? null, v.price ?? null,
          discountPct, salePrice, v.stock, v.low_stock_threshold ?? 5, v.is_active ?? true,
          v.display_order ?? 0, sku, v.id, productId,
        ]
      );
    } else {
      await client.query(
        `INSERT INTO product_variants
           (product_id, sku, color_id, size_id, length_id, price, discount_percent,
            sale_price, stock, low_stock_threshold, is_active, display_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          productId, sku, v.color_id ?? null, v.size_id ?? null, v.length_id ?? null,
          v.price ?? null, discountPct, salePrice, v.stock, v.low_stock_threshold ?? 5,
          v.is_active ?? true, v.display_order ?? 0,
        ]
      );
    }
  }
};

/**
 * Admin: crear una variante suelta (acción puntual desde la tabla editable,
 * sin reenviar todo el producto). INSERT directo de una sola fila — no usa
 * replaceProductVariants, que está pensado para el guardado masivo del
 * formulario completo (ese sí decide qué desactivar comparando contra
 * TODAS las variantes existentes; aquí solo agregamos una más).
 */
export const createProductVariant = async (
  productId: number,
  data: VariantInputDTO
): Promise<ProductVariant> => {
  const productRes = await pool.query('SELECT sku FROM products WHERE id = $1', [productId]);
  if (productRes.rows.length === 0) throw new Error('Producto no encontrado');
  const productSku = productRes.rows[0].sku || 'ALH-000000';

  const discountPct = sanitizeDiscount(data.discount_percent);
  const salePrice = computeSalePrice(data.price ?? null, discountPct);
  let sku = data.sku?.trim() || null;
  if (!sku) {
    const [colorRow, sizeRow, lengthRow] = await Promise.all([
      data.color_id != null ? pool.query('SELECT slug FROM colors WHERE id = $1', [data.color_id]) : Promise.resolve({ rows: [] as any[] }),
      data.size_id != null ? pool.query('SELECT code FROM sizes WHERE id = $1', [data.size_id]) : Promise.resolve({ rows: [] as any[] }),
      data.length_id != null ? pool.query('SELECT code FROM lengths WHERE id = $1', [data.length_id]) : Promise.resolve({ rows: [] as any[] }),
    ]);
    sku = generateVariantSku(productSku, {
      colorSlug: colorRow.rows[0]?.slug ?? null,
      sizeCode: sizeRow.rows[0]?.code ?? null,
      lengthCode: lengthRow.rows[0]?.code ?? null,
    });
  }

  const result = await pool.query(
    `INSERT INTO product_variants
       (product_id, sku, color_id, size_id, length_id, price, discount_percent,
        sale_price, stock, low_stock_threshold, is_active, display_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    [
      productId, sku, data.color_id ?? null, data.size_id ?? null, data.length_id ?? null,
      data.price ?? null, discountPct, salePrice, data.stock, data.low_stock_threshold ?? 5,
      data.is_active ?? true, data.display_order ?? 0,
    ]
  );
  return normalizeVariantRow(result.rows[0]);
};

/** Admin: actualizar una variante suelta. */
export const updateProductVariant = async (
  variantId: number,
  data: Partial<VariantInputDTO>
): Promise<ProductVariant | null> => {
  const current = await getVariantById(variantId);
  if (!current) return null;

  const price = data.price !== undefined ? data.price : current.price;
  const discountPct = sanitizeDiscount(data.discount_percent !== undefined ? data.discount_percent : current.discount_percent);
  const salePrice = computeSalePrice(price ?? null, discountPct);

  const fields: string[] = [];
  const values: any[] = [];
  let n = 1;
  const set = (col: string, val: any) => {
    fields.push(`${col} = $${n++}`);
    values.push(val);
  };

  if (data.sku !== undefined) set('sku', data.sku?.trim() || null);
  if (data.color_id !== undefined) set('color_id', data.color_id);
  if (data.size_id !== undefined) set('size_id', data.size_id);
  if (data.length_id !== undefined) set('length_id', data.length_id);
  if (data.price !== undefined) set('price', data.price);
  // Si cambia el precio o el % de descuento, recalcular ambos derivados
  // (discount_percent normalizado + sale_price) juntos para que nunca
  // queden inconsistentes entre sí.
  if (data.price !== undefined || data.discount_percent !== undefined) {
    set('discount_percent', discountPct);
    set('sale_price', salePrice);
  }
  if (data.stock !== undefined) set('stock', data.stock);
  if (data.low_stock_threshold !== undefined) set('low_stock_threshold', data.low_stock_threshold);
  if (data.is_active !== undefined) set('is_active', data.is_active);
  if (data.display_order !== undefined) set('display_order', data.display_order);

  if (fields.length === 0) return current;

  values.push(variantId);
  const result = await pool.query(
    `UPDATE product_variants SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${n} RETURNING *`,
    values
  );
  return result.rows[0] ? normalizeVariantRow(result.rows[0]) : null;
};

/**
 * Admin: eliminar una variante permanentemente. Solo si ningún pedido la
 * referencia (order_items.variant_id) — si hay historial, se rechaza y
 * se sugiere desactivar en su lugar (is_active = false vía update).
 */
export const deleteProductVariant = async (variantId: number): Promise<void> => {
  const used = await pool.query('SELECT 1 FROM order_items WHERE variant_id = $1 LIMIT 1', [variantId]);
  if (used.rows.length > 0) {
    throw new Error('No se puede eliminar: esta variante tiene pedidos asociados. Desactívala en su lugar.');
  }
  const result = await pool.query('DELETE FROM product_variants WHERE id = $1 RETURNING id', [variantId]);
  if (result.rowCount === 0) throw new Error('Variante no encontrada');
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
    const sku = data.sku?.trim() || (await generateProductSku(client));

    // 1. Crear producto
    const productResult = await client.query(
      `INSERT INTO products (sku, slug, name, category_id, audience_id, thickness_id, description, featured, price, discount_percent, sale_price, stock, low_stock_threshold, wa_template, badge_labels, has_variants, variant_uses_color, variant_uses_size, variant_uses_length)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
       RETURNING *`,
      [
        sku,
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
        data.has_variants || false,
        data.variant_uses_color || false,
        data.variant_uses_size || false,
        data.variant_uses_length || false,
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

    // 8. Agregar variantes (solo si el producto usa variantes)
    if (data.has_variants && data.variants && data.variants.length > 0) {
      await replaceProductVariants(client, product.id, sku, data.variants);
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
    const { material_ids, tag_ids, size_ids, length_ids, color_ids, variants, ...productData } = data;

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

    // Actualizar variantes si se proporcionaron. Igual criterio que los
    // demás arrays: undefined = no tocar; [] = desactivar todas (nunca
    // se borran duro solo por guardar el form con la lista vacía).
    if (variants !== undefined) {
      const skuRow = await client.query('SELECT sku FROM products WHERE id = $1', [id]);
      const productSku = skuRow.rows[0]?.sku || 'ALH-000000';
      await replaceProductVariants(client, id, productSku, variants);
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
