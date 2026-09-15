BEGIN;

-- El índice único idx_product_variants_combo se valida INMEDIATAMENTE
-- después de cada UPDATE dentro de una transacción (no es DEFERRABLE).
-- Esto rompe el caso de "swap": si dos variantes existentes intercambian
-- su combinación de color/talla/largo entre sí (ej. la variante A pasa a
-- tener el color que tenía B, y B pasa a tener el que tenía A), el UPDATE
-- de A choca contra el valor de B que todavía no se actualizó, aunque al
-- terminar la transacción completa ninguna combinación quedaría duplicada.
--
-- Postgres no permite CONSTRAINT ... UNIQUE sobre expresiones (COALESCE),
-- solo sobre columnas reales -- por eso se agregan columnas generadas que
-- normalizan NULL a 0 (mismo criterio que ya usaba el índice), y sobre
-- esas columnas se crea un CONSTRAINT UNIQUE DEFERRABLE INITIALLY DEFERRED:
-- Postgres entonces valida la unicidad solo al hacer COMMIT, permitiendo
-- cualquier swap intermedio dentro de la misma transacción.

ALTER TABLE product_variants
    ADD COLUMN IF NOT EXISTS color_id_norm INTEGER GENERATED ALWAYS AS (COALESCE(color_id, 0)) STORED,
    ADD COLUMN IF NOT EXISTS size_id_norm INTEGER GENERATED ALWAYS AS (COALESCE(size_id, 0)) STORED,
    ADD COLUMN IF NOT EXISTS length_id_norm INTEGER GENERATED ALWAYS AS (COALESCE(length_id, 0)) STORED;

DROP INDEX IF EXISTS idx_product_variants_combo;

ALTER TABLE product_variants DROP CONSTRAINT IF EXISTS product_variants_combo_unique;
ALTER TABLE product_variants ADD CONSTRAINT product_variants_combo_unique
    UNIQUE (product_id, color_id_norm, size_id_norm, length_id_norm)
    DEFERRABLE INITIALLY DEFERRED;

COMMIT;

DO $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count FROM product_variants;
    RAISE NOTICE 'Variantes totales tras migración: %', v_count;
END $$;
