BEGIN;

CREATE TABLE IF NOT EXISTS home_banners (
    id SERIAL PRIMARY KEY,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255) NOT NULL,
    link_url VARCHAR(500),
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_home_banners_active_order
    ON home_banners (is_active, display_order);

COMMIT;

DO $$
DECLARE
    v_total INT;
    v_active INT;
BEGIN
    SELECT COUNT(*) INTO v_total FROM home_banners;
    SELECT COUNT(*) INTO v_active FROM home_banners WHERE is_active = TRUE;

    RAISE NOTICE 'Banners totales: %', v_total;
    RAISE NOTICE 'Banners activos: %', v_active;
END $$;
