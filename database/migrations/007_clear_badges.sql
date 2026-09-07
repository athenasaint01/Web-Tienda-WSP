-- =============================================
-- MIGRACIÓN 007: Quitar badges de calidad de todos los productos
-- Ejecutar en Supabase SQL Editor (idempotente)
-- =============================================
--
-- Vacía el array `products.badge_labels` en todos los productos que aún
-- tengan badges. Los sellos de calidad ("316L", "18K PLATED", "WATERPROOF",
-- "HIPOALERG.", etc.) dejarán de mostrarse sobre las fotos en el catálogo
-- y en la ficha de producto.
--
-- La información de material/acabado ahora vive en el catálogo `materials`
-- (name / name_short / name_en) — ver migración 006.
--
-- Nota: NO elimina la columna `badge_labels` ni el componente BadgeChips;
--       solo limpia los datos. Se puede volver a asignar badges por
--       producto desde el admin si se quisiera.
-- =============================================

BEGIN;

UPDATE products
SET badge_labels = '{}',
    updated_at = CURRENT_TIMESTAMP
WHERE badge_labels IS NOT NULL
  AND array_length(badge_labels, 1) > 0;

COMMIT;

-- =============================================
-- VERIFICACIÓN
-- =============================================
DO $$
DECLARE
    v_con_badges INTEGER;
    v_total INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total FROM products;
    SELECT COUNT(*) INTO v_con_badges
      FROM products
     WHERE badge_labels IS NOT NULL AND array_length(badge_labels, 1) > 0;

    RAISE NOTICE '';
    RAISE NOTICE '✅ Migración 007 completada';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '📦 Productos totales:        %', v_total;
    RAISE NOTICE '🏷️  Productos con badges:     % (debe ser 0)', v_con_badges;
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
