BEGIN;

-- Outlet deja de ser una categoría más (competía con la categoría real
-- del producto, ya que category_id es 1:1) y pasa a ser un flag
-- independiente, a nivel producto y a nivel variante — mismo criterio
-- que is_active, que ya es independiente entre producto e hijo.
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_outlet BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS is_outlet BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_products_is_outlet ON products (is_outlet) WHERE is_outlet = TRUE;

COMMIT;

-- Migración de datos: si existen productos hoy categorizados como
-- "Outlet" (category_id apuntando a esa fila de categories), hay que
-- reasignarlos a su categoría real y marcar is_outlet=true a mano —
-- este script NO lo hace automáticamente porque no hay forma genérica
-- de saber cuál es "la categoría real" de cada producto. Antes de
-- borrar la fila "Outlet" de categories, confirmar que ya no tiene
-- productos apuntándola (categoryService.deleteCategory lo exige).

DO $$
DECLARE
    v_outlet_category_id INT;
    v_products_in_outlet_category INT;
    v_products_with_flag INT;
BEGIN
    SELECT id INTO v_outlet_category_id FROM categories WHERE slug = 'outlet';

    IF v_outlet_category_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_products_in_outlet_category
        FROM products WHERE category_id = v_outlet_category_id;
    ELSE
        v_products_in_outlet_category := 0;
    END IF;

    SELECT COUNT(*) INTO v_products_with_flag FROM products WHERE is_outlet = TRUE;

    RAISE NOTICE 'Categoría "Outlet" (slug=outlet) id: %', v_outlet_category_id;
    RAISE NOTICE 'Productos todavía con category_id = Outlet (pendientes de reasignar): %', v_products_in_outlet_category;
    RAISE NOTICE 'Productos con is_outlet=true: %', v_products_with_flag;
END $$;
