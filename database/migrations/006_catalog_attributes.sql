-- =============================================
-- MIGRACIÓN 006: Atributos de catálogo por producto
-- Ejecutar en Supabase SQL Editor (idempotente, se puede correr varias veces)
-- =============================================
--
-- Agrega los catálogos maestros de: PÚBLICO, TALLA, LARGO, GROSOR, COLOR
-- y MIGRA la tabla `materials` existente al catálogo técnico real (16 items)
-- con nombre corto (badge), nombre en inglés (sello) y código de importación.
--
-- Modelo:
--   - PÚBLICO  (audiences)     -> FK 1:1 en products  (products.audience_id)
--   - GROSOR   (thicknesses)   -> FK 1:1 en products  (products.thickness_id)
--   - TALLA    (sizes)         -> N:M  (product_sizes)      + valor numérico para filtrar/ordenar
--   - LARGO    (lengths)       -> N:M  (product_lengths)    + valor numérico (cm)
--   - COLOR    (colors)        -> N:M  (product_colors)     + hex para swatch + is_primary
--   - MATERIAL (materials)     -> N:M  (product_materials, YA EXISTE) + name_short / name_en / code
--
-- Nota: la PK sigue siendo SERIAL (consistente con el esquema actual).
--       El `code` tipo 'MTR000001' se guarda como columna UNIQUE para import/ERP,
--       NO como clave primaria. El front usa `slug` (filtros) y los nombres.
-- =============================================

BEGIN;

-- =============================================
-- 1. PÚBLICO  (audiences)
-- =============================================
CREATE TABLE IF NOT EXISTS audiences (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE,
    name VARCHAR(30) NOT NULL UNIQUE,
    slug VARCHAR(30) NOT NULL UNIQUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO audiences (code, name, slug, display_order) VALUES
    ('PB0000001', 'Mujer',          'mujer',          1),
    ('PB0000002', 'Hombre',         'hombre',         2),
    ('PB0000003', 'Niño',           'nino',           3),
    ('PB0000004', 'Niña',           'nina',           4),
    ('PB0000005', 'Unisex adulto',  'unisex-adulto',  5),
    ('PB0000006', 'Unisex niño',    'unisex-nino',    6),
    ('PB0000007', 'Bebé',           'bebe',           7)
ON CONFLICT (code) DO UPDATE
    SET name = EXCLUDED.name, slug = EXCLUDED.slug, display_order = EXCLUDED.display_order;

-- =============================================
-- 2. GROSOR  (thicknesses) - escala ordinal 1..5
-- =============================================
CREATE TABLE IF NOT EXISTS thicknesses (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE,
    name VARCHAR(20) NOT NULL UNIQUE,
    slug VARCHAR(20) NOT NULL UNIQUE,
    level SMALLINT NOT NULL,              -- 1 = muy delgado ... 5 = muy grueso (para ordenar)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO thicknesses (code, name, slug, level) VALUES
    ('GR000001', 'Muy delgado', 'muy-delgado', 1),
    ('GR000002', 'Delgado',     'delgado',     2),
    ('GR000003', 'Medio',       'medio',       3),
    ('GR000004', 'Grueso',      'grueso',      4),
    ('GR000005', 'Muy grueso',  'muy-grueso',  5)
ON CONFLICT (code) DO UPDATE
    SET name = EXCLUDED.name, slug = EXCLUDED.slug, level = EXCLUDED.level;

-- =============================================
-- 3. TALLA  (sizes) - anillos
--    label = lo que ve el usuario ; ring_size / diameter_mm = para filtrar y ordenar
-- =============================================
CREATE TABLE IF NOT EXISTS sizes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE,
    label VARCHAR(40) NOT NULL UNIQUE,    -- '6 - 16.5 mm'
    ring_size NUMERIC(4,1),               -- 6
    diameter_mm NUMERIC(5,2),             -- 16.5
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO sizes (code, label, ring_size, diameter_mm, display_order) VALUES
    ('TL000001', '4 - 14.9 mm',  4,  14.9, 1),
    ('TL000002', '5 - 15.7 mm',  5,  15.7, 2),
    ('TL000003', '6 - 16.5 mm',  6,  16.5, 3),
    ('TL000004', '7 - 17.3 mm',  7,  17.3, 4),
    ('TL000005', '8 - 18.1 mm',  8,  18.1, 5),
    ('TL000006', '9 - 18.9 mm',  9,  18.9, 6),
    ('TL000007', '10 - 19.8 mm', 10, 19.8, 7),
    ('TL000008', '11 - 20.6 mm', 11, 20.6, 8),
    ('TL000009', '12 - 21.4 mm', 12, 21.4, 9),
    ('TL000010', '13 - 22.2 mm', 13, 22.2, 10)
ON CONFLICT (code) DO UPDATE
    SET label = EXCLUDED.label, ring_size = EXCLUDED.ring_size,
        diameter_mm = EXCLUDED.diameter_mm, display_order = EXCLUDED.display_order;

-- =============================================
-- 4. LARGO  (lengths) - cadenas / pulseras
--    value_cm = para filtrar por rango ("collares de 40-50 cm") y ordenar
-- =============================================
CREATE TABLE IF NOT EXISTS lengths (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE,
    label VARCHAR(20) NOT NULL UNIQUE,    -- '6 cm'
    value_cm NUMERIC(6,2) NOT NULL,       -- 6.00
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO lengths (code, label, value_cm, display_order) VALUES
    ('LRG0000001', '0.5 cm', 0.5,  1),
    ('LRG0000002', '1 cm',   1,    2),
    ('LRG0000003', '2 cm',   2,    3),
    ('LRG0000004', '2.5 cm', 2.5,  4),
    ('LRG0000005', '3 cm',   3,    5),
    ('LRG0000006', '4 cm',   4,    6),
    ('LRG0000007', '4.5 cm', 4.5,  7),
    ('LRG0000008', '5 cm',   5,    8),
    ('LRG0000009', '6 cm',   6,    9),
    ('LRG0000010', '7 cm',   7,    10),
    ('LRG0000011', '10 cm',  10,   11),
    ('LRG0000012', '14 cm',  14,   12),
    ('LRG0000013', '15 cm',  15,   13),
    ('LRG0000014', '16 cm',  16,   14),
    ('LRG0000015', '17 cm',  17,   15),
    ('LRG0000016', '18 cm',  18,   16),
    ('LRG0000017', '19 cm',  19,   17),
    ('LRG0000018', '20 cm',  20,   18),
    ('LRG0000019', '21 cm',  21,   19),
    ('LRG0000020', '22 cm',  22,   20),
    ('LRG0000021', '25 cm',  25,   21),
    ('LRG0000022', '30 cm',  30,   22),
    ('LRG0000023', '35 cm',  35,   23),
    ('LRG0000024', '38 cm',  38,   24),
    ('LRG0000025', '40 cm',  40,   25),
    ('LRG0000026', '42 cm',  42,   26),
    ('LRG0000027', '45 cm',  45,   27),
    ('LRG0000028', '48 cm',  48,   28),
    ('LRG0000029', '50 cm',  50,   29),
    ('LRG0000030', '55 cm',  55,   30),
    ('LRG0000031', '56 cm',  56,   31),
    ('LRG0000032', '58 cm',  58,   32),
    ('LRG0000033', '60 cm',  60,   33),
    ('LRG0000034', '65 cm',  65,   34),
    ('LRG0000035', '70 cm',  70,   35),
    ('LRG0000036', '75 cm',  75,   36),
    ('LRG0000037', '80 cm',  80,   37),
    ('LRG0000038', '90 cm',  90,   38),
    ('LRG0000039', '100 cm', 100,  39)
ON CONFLICT (code) DO UPDATE
    SET label = EXCLUDED.label, value_cm = EXCLUDED.value_cm, display_order = EXCLUDED.display_order;

-- =============================================
-- 5. COLOR  (colors)
--    hex = swatch en el front. MULTICOLOR / BICOLOR / etc -> hex NULL (ícono especial)
-- =============================================
CREATE TABLE IF NOT EXISTS colors (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE,
    name VARCHAR(40) NOT NULL UNIQUE,
    slug VARCHAR(40) NOT NULL UNIQUE,
    hex CHAR(7),                          -- '#D4AF37'  (NULL para multicolor/bicolor)
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO colors (code, name, slug, hex, display_order) VALUES
    ('CLR000001', 'Plateado',   'plateado',   '#C0C0C0', 1),
    ('CLR000002', 'Dorado',     'dorado',     '#D4AF37', 2),
    ('CLR000003', 'Rosado',     'rosado',     '#F4C2C2', 3),
    ('CLR000004', 'Negro',      'negro',      '#1A1A1A', 4),
    ('CLR000005', 'Blanco',     'blanco',     '#FFFFFF', 5),
    ('CLR000006', 'Rojo',       'rojo',       '#C0392B', 6),
    ('CLR000007', 'Azul',       'azul',       '#2E5FA3', 7),
    ('CLR000008', 'Verde',      'verde',      '#2E7D32', 8),
    ('CLR000009', 'Morado',     'morado',     '#7B2D8B', 9),
    ('CLR000010', 'Celeste',    'celeste',    '#87CEEB', 10),
    ('CLR000011', 'Amarillo',   'amarillo',   '#F1C40F', 11),
    ('CLR000012', 'Naranja',    'naranja',    '#E67E22', 12),
    ('CLR000013', 'Marrón',     'marron',     '#6B4226', 13),
    ('CLR000014', 'Gris',       'gris',       '#808080', 14),
    ('CLR000015', 'Multicolor', 'multicolor', NULL,      15),
    ('CLR000016', 'Bicolor',    'bicolor',    NULL,      16),
    ('CLR000017', 'Tricolor',   'tricolor',   NULL,      17),
    ('CLR000018', 'Monocromo',  'monocromo',  NULL,      18)
ON CONFLICT (code) DO UPDATE
    SET name = EXCLUDED.name, slug = EXCLUDED.slug, hex = EXCLUDED.hex,
        display_order = EXCLUDED.display_order;

-- =============================================
-- 6. MATERIAL - ENRIQUECER LA TABLA EXISTENTE
--    name       = nombre completo en español   -> ficha de detalle del producto
--    name_short = versión corta (<= 24 chars)   -> sello / badge visual del front
--    name_en    = versión en inglés             -> si el sello va en inglés
--    code       = 'MTR000001'                   -> import / ERP (UNIQUE, no PK)
-- =============================================
ALTER TABLE materials ADD COLUMN IF NOT EXISTS code          VARCHAR(20);
ALTER TABLE materials ADD COLUMN IF NOT EXISTS name_short     VARCHAR(24);
ALTER TABLE materials ADD COLUMN IF NOT EXISTS name_en        VARCHAR(60);
ALTER TABLE materials ADD COLUMN IF NOT EXISTS display_order  INTEGER DEFAULT 0;

-- code único (permite NULL para filas viejas hasta que se re-mapeen)
CREATE UNIQUE INDEX IF NOT EXISTS idx_materials_code ON materials(code) WHERE code IS NOT NULL;

-- 6a. Insertar / actualizar el catálogo técnico real (upsert por slug)
--     Si un nombre viejo choca con el constraint UNIQUE de `materials.name`
--     (p.ej. quedó un 'Acero' del seed), se renombra antes para no bloquear.
UPDATE materials SET name = name || ' (obsoleto)'
 WHERE slug NOT IN (
   'plata-950','plata-925','acero-316l','oro-18k','acrilico','zirconia','fantasia','nylon',
   'acero-304l','titanio','acero-316l-bano-oro-18k','acero-304l-bano-oro-18k',
   'acero-316l-enchapado-oro-18k','acero-304l-enchapado-oro-18k',
   'acero-316l-pvd-oro-18k','acero-304l-pvd-oro-18k'
 )
 AND name IN (
   'Plata 950','Plata 925','Acero quirúrgico 316L','Oro 18K','Acrílico','Zirconia','Fantasía',
   'Nylon','Acero 304L','Titanio','Acero 316L con baño en oro 18K','Acero 304L con baño en oro 18K',
   'Acero 316L enchapado tradicional oro 18K','Acero 304L enchapado tradicional oro 18K',
   'Acero 316L enchapado PVD oro 18K','Acero 304L enchapado PVD oro 18K'
 );

INSERT INTO materials (slug, name, name_short, name_en, code, display_order) VALUES
    ('plata-950',                 'Plata 950',                                      'Plata 950',        'Silver 950',              'MTR000001', 1),
    ('plata-925',                 'Plata 925',                                      'Plata 925',        'Sterling Silver 925',     'MTR000002', 2),
    ('acero-316l',                'Acero quirúrgico 316L',                          'Acero 316L',       'Surgical Steel 316L',     'MTR000003', 3),
    ('oro-18k',                   'Oro 18K',                                        'Oro 18K',          'Gold 18K',                'MTR000004', 4),
    ('acrilico',                  'Acrílico',                                       'Acrílico',         'Acrylic',                 'MTR000005', 5),
    ('zirconia',                  'Zirconia',                                       'Zirconia',         'Cubic Zirconia',          'MTR000006', 6),
    ('fantasia',                  'Fantasía',                                       'Fantasía',         'Costume Jewelry',         'MTR000007', 7),
    ('nylon',                     'Nylon',                                          'Nylon',            'Nylon',                   'MTR000008', 8),
    ('acero-304l',                'Acero 304L',                                     'Acero 304L',       'Steel 304L',              'MTR000009', 9),
    ('titanio',                   'Titanio',                                        'Titanio',          'Titanium',                'MTR000010', 10),
    ('acero-316l-bano-oro-18k',   'Acero 316L con baño en oro 18K',                 'Acero + Oro 18K',  'Gold-Plated Steel 316L',  'MTR000011', 11),
    ('acero-304l-bano-oro-18k',   'Acero 304L con baño en oro 18K',                 'Acero + Oro 18K',  'Gold-Plated Steel 304L',  'MTR000012', 12),
    ('acero-316l-enchapado-oro-18k',     'Acero 316L enchapado tradicional oro 18K', 'Enchapado Oro 18K','Gold-Filled Steel 316L', 'MTR000013', 13),
    ('acero-304l-enchapado-oro-18k',     'Acero 304L enchapado tradicional oro 18K', 'Enchapado Oro 18K','Gold-Filled Steel 304L', 'MTR000014', 14),
    ('acero-316l-pvd-oro-18k',    'Acero 316L enchapado PVD oro 18K',               'PVD Oro 18K',      'PVD Gold Steel 316L',     'MTR000015', 15),
    ('acero-304l-pvd-oro-18k',    'Acero 304L enchapado PVD oro 18K',               'PVD Oro 18K',      'PVD Gold Steel 304L',     'MTR000016', 16)
ON CONFLICT (slug) DO UPDATE
    SET name = EXCLUDED.name,
        name_short = EXCLUDED.name_short,
        name_en = EXCLUDED.name_en,
        code = EXCLUDED.code,
        display_order = EXCLUDED.display_order,
        updated_at = CURRENT_TIMESTAMP;

-- 6b. Re-mapear los materiales viejos del seed ('acero', 'bano-de-oro')
--     a los nuevos equivalentes, SIN perder relaciones product_materials.
--     'acero'        -> 'acero-316l'   (acero quirúrgico, el más común en bisutería fina)
--     'bano-de-oro'  -> 'acero-316l-bano-oro-18k'
DO $$
DECLARE
    v_old_id  INTEGER;
    v_new_id  INTEGER;
BEGIN
    -- acero -> acero-316l
    SELECT id INTO v_old_id FROM materials WHERE slug = 'acero';
    SELECT id INTO v_new_id FROM materials WHERE slug = 'acero-316l';
    IF v_old_id IS NOT NULL AND v_new_id IS NOT NULL AND v_old_id <> v_new_id THEN
        UPDATE product_materials pm
           SET material_id = v_new_id
         WHERE pm.material_id = v_old_id
           AND NOT EXISTS (
               SELECT 1 FROM product_materials x
                WHERE x.product_id = pm.product_id AND x.material_id = v_new_id
           );
        DELETE FROM product_materials WHERE material_id = v_old_id;  -- limpia duplicados residuales
        DELETE FROM materials WHERE id = v_old_id;
        RAISE NOTICE 'Material "acero" migrado a "acero-316l"';
    END IF;

    -- bano-de-oro -> acero-316l-bano-oro-18k
    SELECT id INTO v_old_id FROM materials WHERE slug = 'bano-de-oro';
    SELECT id INTO v_new_id FROM materials WHERE slug = 'acero-316l-bano-oro-18k';
    IF v_old_id IS NOT NULL AND v_new_id IS NOT NULL AND v_old_id <> v_new_id THEN
        UPDATE product_materials pm
           SET material_id = v_new_id
         WHERE pm.material_id = v_old_id
           AND NOT EXISTS (
               SELECT 1 FROM product_materials x
                WHERE x.product_id = pm.product_id AND x.material_id = v_new_id
           );
        DELETE FROM product_materials WHERE material_id = v_old_id;
        DELETE FROM materials WHERE id = v_old_id;
        RAISE NOTICE 'Material "bano-de-oro" migrado a "acero-316l-bano-oro-18k"';
    END IF;
END $$;

-- 6c. Backfill: para las filas que ya tienen name_short se deja; el resto queda
--     con name_short = name truncado a 24 (por si hubiera materiales creados a mano)
UPDATE materials
   SET name_short = LEFT(name, 24)
 WHERE name_short IS NULL;

-- =============================================
-- NOTA sobre TAGS:
--   Se revisó el seed y el código. Los 10 tags actuales
--   (minimal, diario, luna, charms, statement, trenzado, clasico,
--    layering, basico, iconico) son PURAMENTE estéticos: NO contienen
--   materiales. Por eso NO se hace ningún mapeo tag -> material.
--   La tabla `tags` queda intacta para clasificación de estilo.
-- =============================================

-- =============================================
-- 7. FK 1:1 EN products  (PÚBLICO y GROSOR)
-- =============================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS audience_id  INTEGER REFERENCES audiences(id)   ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS thickness_id INTEGER REFERENCES thicknesses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_audience  ON products(audience_id);
CREATE INDEX IF NOT EXISTS idx_products_thickness ON products(thickness_id);

-- =============================================
-- 8. TABLAS N:M  (TALLA, LARGO, COLOR)  - mismo patrón que product_materials
-- =============================================
CREATE TABLE IF NOT EXISTS product_sizes (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size_id    INTEGER NOT NULL REFERENCES sizes(id)    ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (product_id, size_id)
);
CREATE INDEX IF NOT EXISTS idx_product_sizes_product ON product_sizes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_sizes_size    ON product_sizes(size_id);

CREATE TABLE IF NOT EXISTS product_lengths (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    length_id  INTEGER NOT NULL REFERENCES lengths(id)  ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (product_id, length_id)
);
CREATE INDEX IF NOT EXISTS idx_product_lengths_product ON product_lengths(product_id);
CREATE INDEX IF NOT EXISTS idx_product_lengths_length  ON product_lengths(length_id);

CREATE TABLE IF NOT EXISTS product_colors (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    color_id   INTEGER NOT NULL REFERENCES colors(id)   ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,          -- color a destacar en la card
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (product_id, color_id)
);
CREATE INDEX IF NOT EXISTS idx_product_colors_product ON product_colors(product_id);
CREATE INDEX IF NOT EXISTS idx_product_colors_color   ON product_colors(color_id);

-- =============================================
-- 9. TRIGGERS updated_at  (reutiliza update_updated_at_column() del schema base)
-- =============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        DROP TRIGGER IF EXISTS update_audiences_updated_at   ON audiences;
        DROP TRIGGER IF EXISTS update_thicknesses_updated_at ON thicknesses;
        DROP TRIGGER IF EXISTS update_sizes_updated_at       ON sizes;
        DROP TRIGGER IF EXISTS update_lengths_updated_at     ON lengths;
        DROP TRIGGER IF EXISTS update_colors_updated_at      ON colors;

        CREATE TRIGGER update_audiences_updated_at   BEFORE UPDATE ON audiences   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        CREATE TRIGGER update_thicknesses_updated_at BEFORE UPDATE ON thicknesses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        CREATE TRIGGER update_sizes_updated_at       BEFORE UPDATE ON sizes       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        CREATE TRIGGER update_lengths_updated_at     BEFORE UPDATE ON lengths     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        CREATE TRIGGER update_colors_updated_at      BEFORE UPDATE ON colors      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

COMMIT;

-- =============================================
-- VERIFICACIÓN
-- =============================================
DO $$
DECLARE
    v_aud INT; v_thk INT; v_siz INT; v_len INT; v_col INT; v_mat INT;
BEGIN
    SELECT COUNT(*) INTO v_aud FROM audiences;
    SELECT COUNT(*) INTO v_thk FROM thicknesses;
    SELECT COUNT(*) INTO v_siz FROM sizes;
    SELECT COUNT(*) INTO v_len FROM lengths;
    SELECT COUNT(*) INTO v_col FROM colors;
    SELECT COUNT(*) INTO v_mat FROM materials WHERE code IS NOT NULL;

    RAISE NOTICE '';
    RAISE NOTICE '✅ Migración 006 completada';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '👥 Públicos (audiences):    %', v_aud;
    RAISE NOTICE '📏 Grosores (thicknesses):  %', v_thk;
    RAISE NOTICE '💍 Tallas (sizes):          %', v_siz;
    RAISE NOTICE '📐 Largos (lengths):        %', v_len;
    RAISE NOTICE '🎨 Colores (colors):        %', v_col;
    RAISE NOTICE '🔩 Materiales c/ code:      %', v_mat;
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

-- =============================================
-- ROLLBACK (solo si necesitas revertir - ejecutar manualmente)
-- =============================================
-- BEGIN;
-- DROP TABLE IF EXISTS product_colors, product_lengths, product_sizes CASCADE;
-- ALTER TABLE products DROP COLUMN IF EXISTS audience_id, DROP COLUMN IF EXISTS thickness_id;
-- DROP TABLE IF EXISTS colors, lengths, sizes, thicknesses, audiences CASCADE;
-- ALTER TABLE materials
--   DROP COLUMN IF EXISTS code,
--   DROP COLUMN IF EXISTS name_short,
--   DROP COLUMN IF EXISTS name_en,
--   DROP COLUMN IF EXISTS display_order;
-- COMMIT;
