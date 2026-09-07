-- =============================================
-- DATOS INICIALES (SEED): WEB ALAHAS
-- Descripción: Datos de ejemplo para desarrollo y testing
-- Nota: Ejecutar DESPUÉS de schema.sql
-- =============================================

BEGIN;

-- =============================================
-- INSERTAR CATEGORÍAS
-- =============================================
INSERT INTO categories (name, slug, description) VALUES
('Collares', 'collares', 'Collares elegantes con acabados de alta calidad'),
('Pulseras', 'pulseras', 'Pulseras minimalistas y versátiles'),
('Anillos', 'anillos', 'Anillos con diseños únicos y statement'),
('Otros', 'otros', 'Otros accesorios y joyas');

-- =============================================
-- INSERTAR MATERIALES
-- =============================================
INSERT INTO materials (name, slug, description) VALUES
('Acero', 'acero', 'Acero inoxidable hipoalergénico de alta calidad'),
('Baño de Oro', 'bano-de-oro', 'Acabado con baño de oro 18k');

-- =============================================
-- INSERTAR TAGS
-- =============================================
INSERT INTO tags (name, slug) VALUES
('Minimal', 'minimal'),
('Diario', 'diario'),
('Luna', 'luna'),
('Charms', 'charms'),
('Statement', 'statement'),
('Trenzado', 'trenzado'),
('Clásico', 'clasico'),
('Layering', 'layering'),
('Básico', 'basico'),
('Icónico', 'iconico');

-- =============================================
-- INSERTAR PRODUCTOS
-- Datos migrados desde client/src/data/products.ts
-- =============================================

-- Producto 1: Collar Aurora
INSERT INTO products (external_id, slug, name, category_id, description, featured, wa_template, is_active)
VALUES (
    'p1',
    'collar-aurora',
    'Collar Aurora',
    (SELECT id FROM categories WHERE slug = 'collares'),
    'Collar tipo media luna, liviano e hipoalergénico.',
    TRUE,
    'Hola, me interesa el Collar Aurora. ¿Está disponible?',
    TRUE
) RETURNING id AS product_id;

-- Imágenes para Collar Aurora
INSERT INTO product_images (product_id, image_url, display_order, is_primary, alt_text)
VALUES (
    (SELECT id FROM products WHERE external_id = 'p1'),
    '/assets/collar.png',
    1,
    TRUE,
    'Collar Aurora - Media luna dorada'
);

-- Materiales para Collar Aurora
INSERT INTO product_materials (product_id, material_id)
VALUES
    ((SELECT id FROM products WHERE external_id = 'p1'), (SELECT id FROM materials WHERE slug = 'acero')),
    ((SELECT id FROM products WHERE external_id = 'p1'), (SELECT id FROM materials WHERE slug = 'bano-de-oro'));

-- Tags para Collar Aurora
INSERT INTO product_tags (product_id, tag_id)
VALUES
    ((SELECT id FROM products WHERE external_id = 'p1'), (SELECT id FROM tags WHERE slug = 'minimal')),
    ((SELECT id FROM products WHERE external_id = 'p1'), (SELECT id FROM tags WHERE slug = 'diario'));

-- Producto 2: Pulsera Luna
INSERT INTO products (external_id, slug, name, category_id, description, featured, is_active)
VALUES (
    'p2',
    'pulsera-luna',
    'Pulsera Luna',
    (SELECT id FROM categories WHERE slug = 'pulseras'),
    'Pulsera con dije de luna en acabado satinado.',
    TRUE,
    TRUE
);

-- Imágenes para Pulsera Luna
INSERT INTO product_images (product_id, image_url, display_order, is_primary, alt_text)
VALUES (
    (SELECT id FROM products WHERE external_id = 'p2'),
    '/assets/pulsera.png',
    1,
    TRUE,
    'Pulsera Luna - Dije de luna satinado'
);

-- Materiales para Pulsera Luna
INSERT INTO product_materials (product_id, material_id)
VALUES
    ((SELECT id FROM products WHERE external_id = 'p2'), (SELECT id FROM materials WHERE slug = 'acero'));

-- Tags para Pulsera Luna
INSERT INTO product_tags (product_id, tag_id)
VALUES
    ((SELECT id FROM products WHERE external_id = 'p2'), (SELECT id FROM tags WHERE slug = 'luna')),
    ((SELECT id FROM products WHERE external_id = 'p2'), (SELECT id FROM tags WHERE slug = 'charms'));

-- Producto 3: Anillo Sol
INSERT INTO products (external_id, slug, name, category_id, description, featured, is_active)
VALUES (
    'p3',
    'anillo-sol',
    'Anillo Sol',
    (SELECT id FROM categories WHERE slug = 'anillos'),
    'Anillo Sol con centro dorado y rayos texturizados.',
    TRUE,
    TRUE
);

-- Imágenes para Anillo Sol
INSERT INTO product_images (product_id, image_url, display_order, is_primary, alt_text)
VALUES (
    (SELECT id FROM products WHERE external_id = 'p3'),
    '/assets/anillo.png',
    1,
    TRUE,
    'Anillo Sol - Centro dorado con rayos'
);

-- Materiales para Anillo Sol
INSERT INTO product_materials (product_id, material_id)
VALUES
    ((SELECT id FROM products WHERE external_id = 'p3'), (SELECT id FROM materials WHERE slug = 'acero')),
    ((SELECT id FROM products WHERE external_id = 'p3'), (SELECT id FROM materials WHERE slug = 'bano-de-oro'));

-- Tags para Anillo Sol
INSERT INTO product_tags (product_id, tag_id)
VALUES
    ((SELECT id FROM products WHERE external_id = 'p3'), (SELECT id FROM tags WHERE slug = 'statement'));

-- Producto 4: Pulsera Trenzada
INSERT INTO products (external_id, slug, name, category_id, description, is_active)
VALUES (
    'p4',
    'pulsera-trenzada',
    'Pulsera Trenzada',
    (SELECT id FROM categories WHERE slug = 'pulseras'),
    'Trama trenzada con brillo sutil.',
    TRUE
);

-- Imágenes para Pulsera Trenzada
INSERT INTO product_images (product_id, image_url, display_order, is_primary, alt_text)
VALUES (
    (SELECT id FROM products WHERE external_id = 'p4'),
    '/assets/pulsera.png',
    1,
    TRUE,
    'Pulsera Trenzada - Diseño tejido elegante'
);

-- Materiales para Pulsera Trenzada
INSERT INTO product_materials (product_id, material_id)
VALUES
    ((SELECT id FROM products WHERE external_id = 'p4'), (SELECT id FROM materials WHERE slug = 'acero'));

-- Tags para Pulsera Trenzada
INSERT INTO product_tags (product_id, tag_id)
VALUES
    ((SELECT id FROM products WHERE external_id = 'p4'), (SELECT id FROM tags WHERE slug = 'trenzado')),
    ((SELECT id FROM products WHERE external_id = 'p4'), (SELECT id FROM tags WHERE slug = 'clasico'));

-- Producto 5: Collar Cadena Fina
INSERT INTO products (external_id, slug, name, category_id, description, is_active)
VALUES (
    'p5',
    'collar-cadena-fina',
    'Collar Cadena Fina',
    (SELECT id FROM categories WHERE slug = 'collares'),
    'Ideal para combinar en capas.',
    TRUE
);

-- Imágenes para Collar Cadena Fina
INSERT INTO product_images (product_id, image_url, display_order, is_primary, alt_text)
VALUES (
    (SELECT id FROM products WHERE external_id = 'p5'),
    '/assets/collar.png',
    1,
    TRUE,
    'Collar Cadena Fina - Perfecto para layering'
);

-- Materiales para Collar Cadena Fina
INSERT INTO product_materials (product_id, material_id)
VALUES
    ((SELECT id FROM products WHERE external_id = 'p5'), (SELECT id FROM materials WHERE slug = 'acero'));

-- Tags para Collar Cadena Fina
INSERT INTO product_tags (product_id, tag_id)
VALUES
    ((SELECT id FROM products WHERE external_id = 'p5'), (SELECT id FROM tags WHERE slug = 'layering')),
    ((SELECT id FROM products WHERE external_id = 'p5'), (SELECT id FROM tags WHERE slug = 'basico'));

-- Producto 6: Anillo Corona
INSERT INTO products (external_id, slug, name, category_id, description, is_active)
VALUES (
    'p6',
    'anillo-corona',
    'Anillo Corona',
    (SELECT id FROM categories WHERE slug = 'anillos'),
    'Anillo con corona, guiño al logo de la marca.',
    TRUE
);

-- Imágenes para Anillo Corona
INSERT INTO product_images (product_id, image_url, display_order, is_primary, alt_text)
VALUES (
    (SELECT id FROM products WHERE external_id = 'p6'),
    '/assets/anillo.png',
    1,
    TRUE,
    'Anillo Corona - Diseño icónico de la marca'
);

-- Materiales para Anillo Corona
INSERT INTO product_materials (product_id, material_id)
VALUES
    ((SELECT id FROM products WHERE external_id = 'p6'), (SELECT id FROM materials WHERE slug = 'acero'));

-- Tags para Anillo Corona
INSERT INTO product_tags (product_id, tag_id)
VALUES
    ((SELECT id FROM products WHERE external_id = 'p6'), (SELECT id FROM tags WHERE slug = 'iconico'));

-- =============================================
-- INSERTAR USUARIO ADMINISTRADOR DE PRUEBA
-- Contraseña: admin123 (bcrypt hash)
-- =============================================
INSERT INTO users (email, password_hash, full_name, role, is_active)
VALUES (
    'admin@alahas.com',
    '$2a$10$rqZJQQQQQQQQQQQQQQQQQeO8n8K3h3h3h3h3h3h3h3h3h3h3h3h3h3', -- CAMBIAR ESTO por un hash real de bcrypt
    'Administrador Alahas',
    'admin',
    TRUE
);

COMMIT;

-- =============================================
-- MENSAJES DE CONFIRMACIÓN
-- =============================================
DO $$
DECLARE
    v_categories_count INTEGER;
    v_materials_count INTEGER;
    v_tags_count INTEGER;
    v_products_count INTEGER;
    v_images_count INTEGER;
    v_users_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_categories_count FROM categories;
    SELECT COUNT(*) INTO v_materials_count FROM materials;
    SELECT COUNT(*) INTO v_tags_count FROM tags;
    SELECT COUNT(*) INTO v_products_count FROM products;
    SELECT COUNT(*) INTO v_images_count FROM product_images;
    SELECT COUNT(*) INTO v_users_count FROM users;

    RAISE NOTICE '';
    RAISE NOTICE '✅ Datos iniciales insertados exitosamente';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '📦 Categorías creadas: %', v_categories_count;
    RAISE NOTICE '🔨 Materiales creados: %', v_materials_count;
    RAISE NOTICE '🏷️  Tags creados: %', v_tags_count;
    RAISE NOTICE '💍 Productos creados: %', v_products_count;
    RAISE NOTICE '🖼️  Imágenes agregadas: %', v_images_count;
    RAISE NOTICE '👤 Usuarios creados: %', v_users_count;
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 Usuario admin de prueba:';
    RAISE NOTICE '   Email: admin@alahas.com';
    RAISE NOTICE '   Password: admin123';
    RAISE NOTICE '   ⚠️  CAMBIAR la contraseña en producción';
    RAISE NOTICE '';
END $$;
