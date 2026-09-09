-- =============================================
-- MIGRACIÓN 013: Métricas de consulta por producto
-- Ejecutar en Supabase SQL Editor (idempotente)
-- =============================================
--
-- Dos contadores independientes por producto:
--   view_count      -> nº de veces que se abrió la ficha del producto
--   wa_click_count  -> nº de veces que se pulsó "Consulta este producto"
--                      (el botón que abre WhatsApp con el mensaje del producto)
--
-- Sirven para el bloque "Top productos consultados" del dashboard y para
-- analizar qué piden más los clientes.
-- =============================================

BEGIN;

ALTER TABLE products ADD COLUMN IF NOT EXISTS view_count     INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS wa_click_count INTEGER NOT NULL DEFAULT 0;

-- Índice para ordenar el ranking rápido (más consultados primero)
CREATE INDEX IF NOT EXISTS idx_products_wa_click_count ON products(wa_click_count DESC);

COMMIT;

-- =============================================
-- VERIFICACIÓN
-- =============================================
DO $$
DECLARE
    v_view BOOLEAN;
    v_wa   BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'products' AND column_name = 'view_count') INTO v_view;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'products' AND column_name = 'wa_click_count') INTO v_wa;

    RAISE NOTICE '';
    RAISE NOTICE '✅ Migración 013 completada';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '👁  products.view_count:      %', v_view;
    RAISE NOTICE '💬 products.wa_click_count:  %', v_wa;
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
