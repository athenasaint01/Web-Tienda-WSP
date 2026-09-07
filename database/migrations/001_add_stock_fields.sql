-- Migración: Agregar campos de stock a tabla products
-- Fecha: 2025-11-15
-- Descripción: Agrega campos stock y low_stock_threshold para gestión de inventario

-- Agregar campos de stock
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5;

-- Crear índice para optimizar búsquedas por stock
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);

-- Actualizar productos existentes con stock inicial
UPDATE products SET stock = 10, low_stock_threshold = 5 WHERE stock IS NULL;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Campos de stock agregados exitosamente';
    RAISE NOTICE '📊 Productos actualizados con stock inicial de 10 unidades';
    RAISE NOTICE '🔍 Índice idx_products_stock creado para optimización';
END $$;
