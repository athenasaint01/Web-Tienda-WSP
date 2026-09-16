BEGIN;

-- Una colección normal enlaza a una categoría real (category_id, FK 1:1).
-- Pero "Outlet" dejó de ser una categoría (022_outlet_flag.sql) y pasó a
-- ser un flag independiente por producto/variante -- así que la colección
-- "Outlet" del Home no puede seguir apuntando a category_id (no hay
-- productos con esa categoría) y necesita un destino especial:
-- /productos?outlet=true en vez de /productos?categoria=<slug>.
--
-- category_id se vuelve nullable para permitir este único caso especial;
-- el resto de colecciones sigue exigiendo category_id en la capa de
-- aplicación (zod), no en el esquema.
ALTER TABLE collections ALTER COLUMN category_id DROP NOT NULL;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS is_outlet_collection BOOLEAN NOT NULL DEFAULT FALSE;

-- Evita que category_id quede vacío en colecciones normales, y que
-- is_outlet_collection=true conviva con una categoría real a la vez.
ALTER TABLE collections DROP CONSTRAINT IF EXISTS collections_category_xor_outlet;
ALTER TABLE collections ADD CONSTRAINT collections_category_xor_outlet
    CHECK (
        (is_outlet_collection = FALSE AND category_id IS NOT NULL)
        OR (is_outlet_collection = TRUE AND category_id IS NULL)
    );

COMMIT;

DO $$
DECLARE
    v_total INT;
    v_outlet INT;
BEGIN
    SELECT COUNT(*) INTO v_total FROM collections;
    SELECT COUNT(*) INTO v_outlet FROM collections WHERE is_outlet_collection = TRUE;

    RAISE NOTICE 'Colecciones totales: %', v_total;
    RAISE NOTICE 'Colecciones marcadas como Outlet: %', v_outlet;
END $$;
