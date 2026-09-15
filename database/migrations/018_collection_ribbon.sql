BEGIN;

ALTER TABLE collections ADD COLUMN IF NOT EXISTS ribbon_label VARCHAR(40);
ALTER TABLE collections ADD COLUMN IF NOT EXISTS ribbon_color VARCHAR(7) NOT NULL DEFAULT '#9C2819';

COMMIT;

DO $$
DECLARE
    v_total INT;
    v_with_ribbon INT;
BEGIN
    SELECT COUNT(*) INTO v_total FROM collections;
    SELECT COUNT(*) INTO v_with_ribbon FROM collections WHERE ribbon_label IS NOT NULL AND ribbon_label <> '';

    RAISE NOTICE 'Colecciones totales: %', v_total;
    RAISE NOTICE 'Colecciones con cintillo activo: %', v_with_ribbon;
END $$;
