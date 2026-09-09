-- =============================================
-- MIGRACIÓN 012: Histórico de pedidos (carrito -> WhatsApp)
-- Ejecutar en Supabase SQL Editor (idempotente)
-- =============================================
--
-- Cuando el cliente pulsa "Pedir por WhatsApp" en el carrito se crea
-- un pedido en estado 'pendiente'. El admin lo revisa y:
--   - "Confirmar"  -> estado 'confirmado' + descuenta stock de cada item
--   - "Descartar"  -> estado 'descartado' (no toca stock)
--
-- order_items guarda SNAPSHOTS (nombre, precio del momento) para que el
-- histórico no cambie si luego se edita o borra el producto.
-- =============================================

BEGIN;

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_name    VARCHAR(120) NOT NULL,
    customer_phone   VARCHAR(30),
    status           VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    currency_symbol  VARCHAR(5) DEFAULT 'S/',
    subtotal         NUMERIC(10,2) NOT NULL DEFAULT 0,   -- suma de los items con precio
    has_unpriced     BOOLEAN DEFAULT FALSE,               -- había productos "a consultar"
    confirmed_at     TIMESTAMP,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Estados válidos
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pendiente', 'confirmado', 'descartado'));

CREATE INDEX IF NOT EXISTS idx_orders_status  ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id      INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id    INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name  VARCHAR(255) NOT NULL,   -- snapshot
    product_slug  VARCHAR(150),            -- snapshot
    qty           INTEGER NOT NULL CHECK (qty > 0),
    unit_price    NUMERIC(10,2),           -- snapshot del precio efectivo (con oferta) al pedir
    line_total    NUMERIC(10,2),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_items_order   ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- Trigger updated_at (reutiliza la función del schema base)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
        CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

COMMIT;

-- =============================================
-- VERIFICACIÓN
-- =============================================
DO $$
DECLARE
    v_orders BOOLEAN;
    v_items  BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT 1 FROM information_schema.tables
                   WHERE table_name = 'orders') INTO v_orders;
    SELECT EXISTS (SELECT 1 FROM information_schema.tables
                   WHERE table_name = 'order_items') INTO v_items;

    RAISE NOTICE '';
    RAISE NOTICE '✅ Migración 012 completada';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '📦 Tabla orders:       %', v_orders;
    RAISE NOTICE '📋 Tabla order_items:  %', v_items;
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
