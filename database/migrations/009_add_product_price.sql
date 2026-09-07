-- =============================================
-- MIGRACIÓN 009: Precio de producto + símbolo de moneda
-- Ejecutar en Supabase SQL Editor (idempotente)
-- =============================================
--
-- - products.price       : precio de venta (nullable; NULL = "sin precio / consultar")
-- - products.sale_price   : precio con descuento (preparado, NO se usa en el front todavía)
-- - settings.currency_symbol : símbolo de moneda mostrado en la tienda (default 'S/')
--
-- El precio se muestra en: card del catálogo, ficha de producto y mensaje
-- de WhatsApp autogenerado.
-- =============================================

BEGIN;

ALTER TABLE products ADD COLUMN IF NOT EXISTS price      NUMERIC(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_price NUMERIC(10,2);

-- Símbolo de moneda configurable desde /admin/settings
INSERT INTO settings (key, value)
VALUES ('currency_symbol', 'S/')
ON CONFLICT (key) DO NOTHING;

COMMIT;

-- =============================================
-- VERIFICACIÓN
-- =============================================
DO $$
DECLARE
    v_has_price   BOOLEAN;
    v_has_sale    BOOLEAN;
    v_currency    TEXT;
BEGIN
    SELECT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'products' AND column_name = 'price') INTO v_has_price;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'products' AND column_name = 'sale_price') INTO v_has_sale;
    SELECT value INTO v_currency FROM settings WHERE key = 'currency_symbol';

    RAISE NOTICE '';
    RAISE NOTICE '✅ Migración 009 completada';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '💲 products.price:        %', v_has_price;
    RAISE NOTICE '🏷️  products.sale_price:   %', v_has_sale;
    RAISE NOTICE '💱 currency_symbol:       %', COALESCE(v_currency, '(no seteado)');
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
