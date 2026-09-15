import pool from '../config/database';

export interface Banner {
  id: number;
  image_url: string;
  alt_text: string;
  link_url?: string | null;
  display_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface BannerInput {
  image_url: string;
  alt_text: string;
  link_url?: string | null;
  display_order?: number;
  is_active?: boolean;
}

/**
 * Obtener todos los banners (para admin)
 */
export const getAllBanners = async (): Promise<Banner[]> => {
  const result = await pool.query(
    'SELECT * FROM home_banners ORDER BY display_order ASC, created_at DESC'
  );
  return result.rows;
};

/**
 * Obtener solo banners activos (para mostrar en el Home)
 */
export const getActiveBanners = async (): Promise<Banner[]> => {
  const result = await pool.query(
    'SELECT * FROM home_banners WHERE is_active = TRUE ORDER BY display_order ASC'
  );
  return result.rows;
};

/**
 * Obtener banner por ID
 */
export const getBannerById = async (id: number): Promise<Banner | null> => {
  const result = await pool.query('SELECT * FROM home_banners WHERE id = $1', [id]);
  return result.rows[0] || null;
};

/**
 * Crear nuevo banner
 */
export const createBanner = async (data: BannerInput): Promise<Banner> => {
  const { image_url, alt_text, link_url = null, display_order = 0, is_active = true } = data;

  const result = await pool.query(
    `INSERT INTO home_banners (image_url, alt_text, link_url, display_order, is_active)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [image_url, alt_text, link_url, display_order, is_active]
  );

  return result.rows[0];
};

/**
 * Actualizar banner
 */
export const updateBanner = async (
  id: number,
  data: Partial<BannerInput>
): Promise<Banner | null> => {
  const { image_url, alt_text, link_url, display_order, is_active } = data;

  const result = await pool.query(
    `UPDATE home_banners
     SET image_url = COALESCE($1, image_url),
         alt_text = COALESCE($2, alt_text),
         link_url = CASE WHEN $3::text IS NOT NULL THEN NULLIF($3::text, '') ELSE link_url END,
         display_order = COALESCE($4, display_order),
         is_active = COALESCE($5, is_active),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $6
     RETURNING *`,
    [image_url, alt_text, link_url, display_order, is_active, id]
  );

  return result.rows[0] || null;
};

/**
 * Eliminar banner
 */
export const deleteBanner = async (id: number): Promise<boolean> => {
  const result = await pool.query(
    'DELETE FROM home_banners WHERE id = $1 RETURNING id',
    [id]
  );

  return result.rowCount ? result.rowCount > 0 : false;
};

/**
 * Reordenar banners (actualizar display_order de múltiples)
 */
export const reorderBanners = async (orders: { id: number; display_order: number }[]): Promise<void> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const { id, display_order } of orders) {
      await client.query(
        'UPDATE home_banners SET display_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
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
