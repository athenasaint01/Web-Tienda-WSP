-- =============================================
-- MIGRACIÓN 010: Descuento por porcentaje
-- Ejecutar en Supabase SQL Editor (idempotente)
-- =============================================
--
-- Cambia el modelo de oferta: en vez de guardar el precio de oferta
-- (sale_price) como entrada del admin, se guarda el PORCENTAJE de
-- descuento. El backend calcula sale_price = round(price * (1 - pct/100), 2)
-- en cada respuesta.
--
-- - products.discount_percent : entero 0-95 (NULL o 0 = sin oferta)
-- - products.sale_price       : se conserva la columna, ahora es un valor
--                               DERIVADO que el backend recalcula. Se
--                               rellena aquí para los productos que ya
--                               tuvieran una oferta con el modelo anterior.
-- =============================================

BEGIN;

ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percent SMALLINT;

-- Migrar ofertas del modelo anterior (sale_price fijo) -> discount_percent
-- Solo para productos que hoy tengan una oferta válida.
UPDATE products
SET discount_percent = ROUND((1 - sale_price / price) * 100)::smallint
WHERE price IS NOT NULL
  AND sale_price IS NOT NULL
  AND sale_price > 0
  AND sale_price < price
  AND discount_percent IS NULL;

-- Recalcular sale_price desde el porcentaje (mantiene consistencia).
UPDATE products
SET sale_price = ROUND(price * (1 - discount_percent::numeric / 100), 2)
WHERE price IS NOT NULL
  AND discount_percent IS NOT NULL
  AND discount_percent > 0
  AND discount_percent < 100;

-- Limpiar sale_price donde no hay descuento válido.
UPDATE products
SET sale_price = NULL
WHERE discount_percent IS NULL OR discount_percent <= 0;

-- Constraint de rango (0-95). Se elimina primero por si se re-ejecuta.
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_discount_percent_range;
ALTER TABLE products ADD CONSTRAINT products_discount_percent_range
  CHECK (discount_percent IS NULL OR (discount_percent >= 0 AND discount_percent <= 95));

COMMIT;

-- =============================================
-- VERIFICACIÓN
-- =============================================
DO $$
DECLARE
    v_has_col   BOOLEAN;
    v_con_desc  INTEGER;
BEGIN
    SELECT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'products' AND column_name = 'discount_percent') INTO v_has_col;
    SELECT COUNT(*) INTO v_con_desc
      FROM products
     WHERE discount_percent IS NOT NULL AND discount_percent > 0;

    RAISE NOTICE '';
    RAISE NOTICE '✅ Migración 010 completada';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '💯 products.discount_percent:  %', v_has_col;
    RAISE NOTICE '🏷️  Productos con descuento:    %', v_con_desc;
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
