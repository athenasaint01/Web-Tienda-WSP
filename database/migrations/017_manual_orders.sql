-- =============================================
-- MIGRACIÓN 017: Pedidos manuales (registro directo por el admin)
-- Ejecutar en Supabase SQL Editor (idempotente)
-- =============================================
--
-- Permite al admin registrar un pedido "a mano" (cliente cercano, venta
-- por otro canal, etc.) sin que pase por el carrito web. Reutiliza las
-- mismas tablas orders/order_items:
--
--   orders.source          -> 'web' (default, todo lo existente) o
--                              'manual' (creado desde el panel admin).
--   order_items.manual_price -> TRUE si ese ítem llevó un precio forzado
--                              por el admin en vez del precio de
--                              catálogo/variante. Queda como snapshot
--                              histórico, no afecta el cálculo (ya hecho
--                              al crear el pedido).
--
-- No toca ningún pedido existente: source nace en 'web' para todos y
-- manual_price en FALSE para todos los items ya guardados.
-- =============================================

BEGIN;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS source VARCHAR(10) NOT NULL DEFAULT 'web';

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_source_check;
ALTER TABLE orders ADD CONSTRAINT orders_source_check
  CHECK (source IN ('web', 'manual'));

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS manual_price BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_orders_source ON orders(source);

COMMIT;

-- =============================================
-- VERIFICACIÓN
-- =============================================
DO $$
DECLARE
    v_source_col BOOLEAN;
    v_manual_col BOOLEAN;
    v_web_count  INT;
BEGIN
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'source') INTO v_source_col;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'manual_price') INTO v_manual_col;
    SELECT COUNT(*) INTO v_web_count FROM orders WHERE source = 'web';

    RAISE NOTICE '';
    RAISE NOTICE '✅ Migración 017 completada';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '📦 orders.source existe:           %', v_source_col;
    RAISE NOTICE '📦 order_items.manual_price existe: %', v_manual_col;
    RAISE NOTICE '🔢 Pedidos existentes marcados web: %', v_web_count;
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
