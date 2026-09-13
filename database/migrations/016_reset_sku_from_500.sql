-- =============================================
-- MIGRACIÓN 016: Reiniciar el correlativo de SKU desde ALH-000501
-- Ejecutar en Supabase SQL Editor (idempotente)
-- =============================================
--
-- Reasigna el SKU de cada producto EXISTENTE en orden de creación,
-- empezando en ALH-000501 (en vez de continuar desde donde quedó la
-- secuencia). Reinicia product_sku_seq para que el próximo producto
-- nuevo continúe justo después del último asignado.
--
-- Además, si algún producto tiene variantes cuyo SKU fue autogenerado
-- a partir del SKU viejo del producto (patrón '<SKU_VIEJO>-<sufijo>'),
-- se le reasigna el mismo sufijo pero con el SKU nuevo del producto,
-- para que sigan siendo coherentes (ALH-000004-DOR-T7 pasa a ser
-- ALH-000501-DOR-T7 si el producto ahora es 501).
--
-- Los SKU que el admin haya escrito a mano (no siguen el patrón
-- 'ALH-XXXXXX') se DEJAN INTACTOS -- esta migración solo reordena el
-- correlativo automático, nunca sobrescribe un código personalizado.
--
-- Se hace en dos pasadas para no violar el índice único a mitad de
-- camino: si el producto A pasa a tener el SKU que hoy tiene el
-- producto B (que todavía no le tocó su turno), Postgres rechaza el
-- UPDATE aunque al final de la transacción todo quede sin duplicados
-- -- la restricción se checa por fila, no al COMMIT. Por eso primero
-- se guarda el mapeo id->sku_viejo en una tabla temporal, se vacían a
-- NULL los SKU a reasignar (sin colisión posible: el índice único es
-- parcial, WHERE sku IS NOT NULL), y luego se asignan los definitivos.
-- =============================================

BEGIN;

CREATE TEMP TABLE _sku_reset_map (
    product_id INTEGER PRIMARY KEY,
    old_sku    TEXT,
    new_sku    TEXT
);

-- Capturar el orden y el SKU viejo antes de tocar nada.
INSERT INTO _sku_reset_map (product_id, old_sku, new_sku)
SELECT
    p.id,
    p.sku,
    'ALH-' || LPAD((500 + ROW_NUMBER() OVER (ORDER BY p.created_at ASC, p.id ASC))::text, 6, '0')
FROM products p
WHERE p.sku IS NULL OR p.sku ~ '^ALH-[0-9]{6}$';

-- Pasada 1: vaciar los SKU que se van a reasignar (nunca colisiona,
-- el índice único es parcial y no cubre NULL).
UPDATE products SET sku = NULL
WHERE id IN (SELECT product_id FROM _sku_reset_map);

-- Pasada 2: asignar el nuevo correlativo ya sin nada en el camino.
UPDATE products p
SET sku = m.new_sku
FROM _sku_reset_map m
WHERE p.id = m.product_id;

-- Reasignar el sufijo de las variantes cuyo SKU fue autogenerado a
-- partir del SKU viejo del producto padre.
UPDATE product_variants pv
SET sku = m.new_sku || substring(pv.sku FROM length(m.old_sku) + 1)
FROM _sku_reset_map m
WHERE pv.product_id = m.product_id
  AND m.old_sku IS NOT NULL
  AND pv.sku LIKE m.old_sku || '-%';

-- Reiniciar la secuencia para que el próximo producto nuevo continúe
-- justo después del último correlativo asignado (500 + cantidad de
-- productos reasignados en esta corrida).
DO $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count FROM _sku_reset_map;
    PERFORM setval('product_sku_seq', 500 + v_count, true);
END $$;

COMMIT;

-- =============================================
-- VERIFICACIÓN
-- =============================================
DO $$
DECLARE
    v_min TEXT;
    v_max TEXT;
    v_total INT;
    v_duplicates INT;
    v_seq_val BIGINT;
BEGIN
    SELECT MIN(sku) INTO v_min FROM products WHERE sku ~ '^ALH-[0-9]{6}$';
    SELECT MAX(sku) INTO v_max FROM products WHERE sku ~ '^ALH-[0-9]{6}$';
    SELECT COUNT(*) INTO v_total FROM products;
    SELECT COUNT(*) INTO v_duplicates FROM (
        SELECT sku FROM products WHERE sku IS NOT NULL GROUP BY sku HAVING COUNT(*) > 1
    ) d;
    SELECT last_value INTO v_seq_val FROM product_sku_seq;

    RAISE NOTICE '';
    RAISE NOTICE '✅ Migración 016 completada';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '📦 Productos totales:          %', v_total;
    RAISE NOTICE '🔢 SKU más bajo:                %', v_min;
    RAISE NOTICE '🔢 SKU más alto:                %', v_max;
    RAISE NOTICE '➡️  Próximo SKU a generar:       ALH-%', LPAD((v_seq_val + 1)::text, 6, '0');
    RAISE NOTICE '⚠️  SKUs duplicados (debe ser 0): %', v_duplicates;
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
