-- =============================================
-- MIGRACIÓN 015: Variantes de producto (color/talla/largo con precio,
-- descuento y stock propios)
-- Ejecutar en Supabase SQL Editor (idempotente)
-- =============================================
--
-- Permite que un producto (ej. una "pulsera reloj") tenga variantes por
-- color, talla y/o largo donde CADA combinación tiene su propio precio,
-- su propio % de descuento y su propio stock — independientes entre sí
-- aunque compartan el mismo producto padre (mismo nombre/fotos/descripción).
--
-- No toca ningún producto existente: has_variants nace en FALSE para
-- todos y la tabla product_variants nace vacía. Los productos "simples"
-- (precio/stock a nivel producto) siguen funcionando exactamente igual.
-- =============================================

BEGIN;

-- Flags explícitos en products: qué eje(s) usa este producto para sus
-- variantes. Son columnas propias (no se infieren de las variantes que
-- existan) para que la UI sepa qué selectores mostrar incluso antes de
-- que se haya creado ninguna variante.
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_variants        BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS variant_uses_color  BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS variant_uses_size   BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS variant_uses_length BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS product_variants (
    id SERIAL PRIMARY KEY,
    product_id   INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku          VARCHAR(40),
    color_id     INTEGER REFERENCES colors(id)  ON DELETE RESTRICT,
    size_id      INTEGER REFERENCES sizes(id)   ON DELETE RESTRICT,
    length_id    INTEGER REFERENCES lengths(id) ON DELETE RESTRICT,
    price               NUMERIC(10,2),
    discount_percent    SMALLINT,
    sale_price          NUMERIC(10,2),  -- DERIVADO, igual criterio que products.sale_price
    stock               INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rango válido de descuento, igual que en products.
ALTER TABLE product_variants DROP CONSTRAINT IF EXISTS product_variants_discount_range;
ALTER TABLE product_variants ADD CONSTRAINT product_variants_discount_range
    CHECK (discount_percent IS NULL OR (discount_percent >= 0 AND discount_percent <= 95));

-- Unicidad de combinación. Postgres NO trata dos NULL como iguales en un
-- UNIQUE normal, así que sin este COALESCE dos variantes que solo usan
-- color (size_id y length_id ambos NULL) no chocarían nunca entre sí.
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_variants_combo
    ON product_variants (product_id, COALESCE(color_id, 0), COALESCE(size_id, 0), COALESCE(length_id, 0));

-- SKU de variante único (mismo patrón que products.sku: índice parcial,
-- permite NULL sin romper la restricción).
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_variants_sku_unique
    ON product_variants (sku) WHERE sku IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_active  ON product_variants(product_id, is_active);

-- Snapshot de la variante elegida en cada línea de pedido. ON DELETE SET
-- NULL (no RESTRICT): un pedido histórico no debe desaparecer ni bloquear
-- el borrado si la variante se elimina más adelante — variant_sku/label
-- ya quedaron guardados como texto en el momento del pedido.
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id    INTEGER REFERENCES product_variants(id) ON DELETE SET NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_sku   VARCHAR(40);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_label VARCHAR(255);

-- Trigger updated_at (reutiliza la función del schema base, igual patrón
-- que orders/order_items en la migración 012).
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        DROP TRIGGER IF EXISTS update_product_variants_updated_at ON product_variants;
        CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

COMMIT;

-- =============================================
-- VERIFICACIÓN
-- =============================================
DO $$
DECLARE
    v_table   BOOLEAN;
    v_flag    BOOLEAN;
    v_oi_cols INTEGER;
    v_existing_variants INTEGER;
    v_products_with_variants INTEGER;
BEGIN
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_variants') INTO v_table;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'has_variants') INTO v_flag;
    SELECT COUNT(*) INTO v_oi_cols FROM information_schema.columns
     WHERE table_name = 'order_items' AND column_name IN ('variant_id','variant_sku','variant_label');
    SELECT COUNT(*) INTO v_existing_variants FROM product_variants;
    SELECT COUNT(*) INTO v_products_with_variants FROM products WHERE has_variants = TRUE;

    RAISE NOTICE '';
    RAISE NOTICE '✅ Migración 015 completada';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '📦 Tabla product_variants existe:      %', v_table;
    RAISE NOTICE '🚩 products.has_variants existe:        %', v_flag;
    RAISE NOTICE '📋 Columnas variant_* en order_items:   % / 3', v_oi_cols;
    RAISE NOTICE '🔢 Variantes existentes (debe ser 0):   %', v_existing_variants;
    RAISE NOTICE '🔢 Productos con has_variants=TRUE (debe ser 0): %', v_products_with_variants;
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
