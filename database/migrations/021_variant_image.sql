BEGIN;

-- Imagen destacada por variante: apunta a una de las URLs ya subidas en
-- product_images de ese mismo producto (no requiere subir archivos nuevos,
-- el admin solo elige cuál usar). NULL = la variante no tiene imagen
-- propia, se sigue mostrando la imagen principal del producto.
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMIT;

DO $$
DECLARE
    v_total INT;
    v_with_image INT;
BEGIN
    SELECT COUNT(*) INTO v_total FROM product_variants;
    SELECT COUNT(*) INTO v_with_image FROM product_variants WHERE image_url IS NOT NULL;

    RAISE NOTICE 'Variantes totales: %', v_total;
    RAISE NOTICE 'Variantes con imagen propia: %', v_with_image;
END $$;
