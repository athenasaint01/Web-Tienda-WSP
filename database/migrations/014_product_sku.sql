-- =============================================
-- MIGRACIÓN 014: SKU a nivel de producto
-- Ejecutar en Supabase SQL Editor (idempotente)
-- =============================================
--
-- Agrega products.sku: código legible y único por producto.
-- Formato por defecto: 'ALH-000001' (prefijo fijo + correlativo con padding).
-- El admin puede sobrescribirlo libremente desde el formulario; solo se
-- exige que sea único.
--
-- Backfill: a cada producto existente sin SKU se le asigna uno basado en
-- una secuencia propia, ordenado por fecha de creación para que el primer
-- producto creado reciba el correlativo más bajo.
-- =============================================

BEGIN;

-- Secuencia propia para el correlativo (independiente de products.id, así
-- un futuro borrado de productos no genera huecos raros en el SKU y el
-- backend puede pedir "el siguiente" de forma atómica sin condición de
-- carrera entre creaciones concurrentes).
CREATE SEQUENCE IF NOT EXISTS product_sku_seq;

ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(40);

-- Backfill: productos existentes sin SKU, correlativo en orden de creación.
DO $$
DECLARE
    r RECORD;
    v_next BIGINT;
BEGIN
    FOR r IN
        SELECT id FROM products WHERE sku IS NULL ORDER BY created_at ASC, id ASC
    LOOP
        v_next := nextval('product_sku_seq');
        UPDATE products
           SET sku = 'ALH-' || LPAD(v_next::text, 6, '0')
         WHERE id = r.id;
    END LOOP;
END $$;

-- Unicidad: índice único parcial (permite NULL sin romper la restricción,
-- aunque hoy todas las filas quedan con SKU tras el backfill).
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku_unique
    ON products (sku) WHERE sku IS NOT NULL;

COMMIT;

-- =============================================
-- VERIFICACIÓN
-- =============================================
DO $$
DECLARE
    v_total INT;
    v_with_sku INT;
    v_duplicates INT;
BEGIN
    SELECT COUNT(*) INTO v_total FROM products;
    SELECT COUNT(*) INTO v_with_sku FROM products WHERE sku IS NOT NULL;
    SELECT COUNT(*) INTO v_duplicates FROM (
        SELECT sku FROM products WHERE sku IS NOT NULL GROUP BY sku HAVING COUNT(*) > 1
    ) d;

    RAISE NOTICE '';
    RAISE NOTICE '✅ Migración 014 completada';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '📦 Productos totales:        %', v_total;
    RAISE NOTICE '🏷️  Productos con SKU:        %', v_with_sku;
    RAISE NOTICE '⚠️  SKUs duplicados:          %', v_duplicates;
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
