-- =============================================
-- MIGRACIÓN 008: Materiales por defecto en productos existentes
-- Ejecutar en Supabase SQL Editor (idempotente)
-- =============================================
--
-- Instrucción del cliente (chat, 06-sep-2026):
--   "Solo ponles acero y baño 18k a todo. A todos, menos los plateados.
--    A esos [plateados] solo acero 316."
--
-- Este script aplica la regla general (acero 316L + baño oro 18K) a TODOS
-- los productos. No hay productos "plateados" identificados aún; cuando los
-- haya, se les quita `acero-316l-bano-oro-18k` desde el admin o con un
-- UPDATE puntual.
--
-- Requiere: migración 006 aplicada (materiales con slug 'acero-316l' y
--           'acero-316l-bano-oro-18k' presentes).
--
-- NO toca badge_labels (siguen vacíos tras la migración 007).
-- =============================================

BEGIN;

DO $$
DECLARE
    v_acero  INTEGER;
    v_bano   INTEGER;
BEGIN
    SELECT id INTO v_acero FROM materials WHERE slug = 'acero-316l';
    SELECT id INTO v_bano  FROM materials WHERE slug = 'acero-316l-bano-oro-18k';

    IF v_acero IS NULL OR v_bano IS NULL THEN
        RAISE EXCEPTION 'Faltan materiales base (acero-316l / acero-316l-bano-oro-18k). Ejecuta primero la migración 006.';
    END IF;

    -- Reemplazar los materiales de cada producto por los 2 por defecto
    DELETE FROM product_materials;

    INSERT INTO product_materials (product_id, material_id)
    SELECT p.id, v_acero FROM products p
    UNION ALL
    SELECT p.id, v_bano  FROM products p;

    RAISE NOTICE 'Materiales asignados a % productos: acero-316l + acero-316l-bano-oro-18k',
        (SELECT COUNT(*) FROM products);
END $$;

COMMIT;

-- =============================================
-- VERIFICACIÓN
-- =============================================
DO $$
DECLARE
    v_sin_materiales INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_sin_materiales
      FROM products p
     WHERE NOT EXISTS (SELECT 1 FROM product_materials pm WHERE pm.product_id = p.id);

    RAISE NOTICE '';
    RAISE NOTICE '✅ Migración 008 completada';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '📦 Productos sin materiales: % (debe ser 0)', v_sin_materiales;
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

-- =============================================
-- Para marcar un producto como "plateado" (solo acero 316L):
-- =============================================
-- DELETE FROM product_materials
-- WHERE product_id = (SELECT id FROM products WHERE slug = 'SLUG-DEL-PRODUCTO')
--   AND material_id = (SELECT id FROM materials WHERE slug = 'acero-316l-bano-oro-18k');
