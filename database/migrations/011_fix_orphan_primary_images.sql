-- =============================================
-- MIGRACIÓN 011: Reparar imágenes sin "principal"
-- Ejecutar en Supabase SQL Editor (idempotente)
-- =============================================
--
-- Corrige productos que tienen imágenes pero ninguna marcada como
-- is_primary = TRUE. El listado de productos busca la imagen por
-- is_primary = TRUE, así que esos productos aparecían "sin imagen"
-- en el catálogo aunque sí tuvieran fotos.
--
-- Causa: el PUT de actualización de producto insertaba las imágenes
-- nuevas siempre con is_primary = FALSE. Corregido en el código
-- (productService.ensurePrimaryImage), esta migración arregla los
-- datos que ya quedaron mal.
-- =============================================

BEGIN;

-- 1. Marcar como principal la primera imagen (por display_order) de cada
--    producto que no tenga ninguna principal.
UPDATE product_images
SET is_primary = TRUE
WHERE id IN (
  SELECT DISTINCT ON (pi.product_id) pi.id
  FROM product_images pi
  WHERE NOT EXISTS (
    SELECT 1 FROM product_images x
    WHERE x.product_id = pi.product_id AND x.is_primary = TRUE
  )
  ORDER BY pi.product_id, pi.display_order, pi.id
);

-- 2. Si algún producto quedó con MÁS de una principal, dejar solo la
--    de menor display_order.
UPDATE product_images
SET is_primary = FALSE
WHERE is_primary = TRUE
  AND id NOT IN (
    SELECT DISTINCT ON (pi.product_id) pi.id
    FROM product_images pi
    WHERE pi.is_primary = TRUE
    ORDER BY pi.product_id, pi.display_order, pi.id
  );

COMMIT;

-- =============================================
-- VERIFICACIÓN
-- =============================================
DO $$
DECLARE
    v_sin_primary INTEGER;
    v_multi       INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_sin_primary
    FROM products p
    WHERE EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id)
      AND NOT EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = TRUE);

    SELECT COUNT(*) INTO v_multi
    FROM (
      SELECT product_id FROM product_images WHERE is_primary = TRUE
      GROUP BY product_id HAVING COUNT(*) > 1
    ) t;

    RAISE NOTICE '';
    RAISE NOTICE '✅ Migración 011 completada';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '🖼️  Productos con imágenes pero sin principal: % (debe ser 0)', v_sin_primary;
    RAISE NOTICE '🖼️  Productos con más de una principal:        % (debe ser 0)', v_multi;
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
