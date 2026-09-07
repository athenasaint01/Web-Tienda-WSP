-- =============================================
-- BASE DE DATOS: WEB ALAHAS - E-COMMERCE JOYERÍA
-- Versión: 1.0
-- Autor: Sistema de Gestión de Contenidos
-- Fecha: 2025
-- =============================================

-- Eliminar tablas existentes (solo en desarrollo)
DROP TABLE IF EXISTS product_tags CASCADE;
DROP TABLE IF EXISTS product_materials CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS materials CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =============================================
-- TABLA: categories
-- Descripción: Categorías de productos (collares, pulseras, anillos, etc.)
-- =============================================
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para categories
CREATE INDEX idx_categories_slug ON categories(slug);

-- =============================================
-- TABLA: materials
-- Descripción: Materiales disponibles (acero, baño de oro, etc.)
-- =============================================
CREATE TABLE materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para materials
CREATE INDEX idx_materials_slug ON materials(slug);

-- =============================================
-- TABLA: tags
-- Descripción: Etiquetas/tags para clasificación de productos
-- =============================================
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para tags
CREATE INDEX idx_tags_slug ON tags(slug);

-- =============================================
-- TABLA: products
-- Descripción: Productos principales de la tienda
-- =============================================
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(50) UNIQUE, -- ID del sistema antiguo (p1, p2, etc.)
    slug VARCHAR(150) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    description TEXT,
    featured BOOLEAN DEFAULT FALSE,
    wa_template TEXT, -- Template personalizado para WhatsApp
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para products
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_featured ON products(featured);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_external_id ON products(external_id);

-- =============================================
-- TABLA: product_images
-- Descripción: Imágenes de productos (relación 1:N)
-- =============================================
CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0, -- Orden de visualización
    is_primary BOOLEAN DEFAULT FALSE, -- Imagen principal
    alt_text VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para product_images
CREATE INDEX idx_product_images_product ON product_images(product_id);
CREATE INDEX idx_product_images_order ON product_images(product_id, display_order);
CREATE INDEX idx_product_images_primary ON product_images(product_id, is_primary);

-- =============================================
-- TABLA: product_materials (Relación N:M)
-- Descripción: Relación entre productos y materiales
-- =============================================
CREATE TABLE product_materials (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, material_id)
);

-- Índices para product_materials
CREATE INDEX idx_product_materials_product ON product_materials(product_id);
CREATE INDEX idx_product_materials_material ON product_materials(material_id);

-- =============================================
-- TABLA: product_tags (Relación N:M)
-- Descripción: Relación entre productos y tags
-- =============================================
CREATE TABLE product_tags (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, tag_id)
);

-- Índices para product_tags
CREATE INDEX idx_product_tags_product ON product_tags(product_id);
CREATE INDEX idx_product_tags_tag ON product_tags(tag_id);

-- =============================================
-- TABLA: users
-- Descripción: Usuarios administradores del CMS
-- =============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- Almacenar con bcrypt
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin', -- admin, editor, etc.
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);

-- =============================================
-- TRIGGERS: Auto-actualizar updated_at
-- =============================================

-- Función genérica para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_images_updated_at BEFORE UPDATE ON product_images
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- COMENTARIOS EN TABLAS
-- =============================================

COMMENT ON TABLE categories IS 'Categorías de productos (collares, pulseras, anillos, etc.)';
COMMENT ON TABLE materials IS 'Materiales disponibles (acero, baño de oro, etc.)';
COMMENT ON TABLE tags IS 'Etiquetas para clasificación y filtrado de productos';
COMMENT ON TABLE products IS 'Catálogo principal de productos';
COMMENT ON TABLE product_images IS 'Imágenes asociadas a productos';
COMMENT ON TABLE product_materials IS 'Relación muchos a muchos entre productos y materiales';
COMMENT ON TABLE product_tags IS 'Relación muchos a muchos entre productos y tags';
COMMENT ON TABLE users IS 'Usuarios administradores del CMS';

-- =============================================
-- FIN DEL ESQUEMA
-- =============================================

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Esquema de base de datos creado exitosamente';
    RAISE NOTICE '📊 Tablas creadas: 8';
    RAISE NOTICE '🔍 Índices creados: 15+';
    RAISE NOTICE '⚡ Triggers creados: 6';
END $$;
