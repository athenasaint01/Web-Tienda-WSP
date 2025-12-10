/**
 * Script de migración: Convierte imágenes base64 a archivos
 *
 * Este script:
 * 1. Lee todos los productos con imágenes base64 de la BD
 * 2. Convierte cada imagen base64 a archivos (3 tamaños)
 * 3. Actualiza la BD con las nuevas rutas
 * 4. Opcionalmente elimina los datos base64 para ahorrar espacio
 *
 * Uso:
 *   npm run migrate-images        # Ver qué se migrará (dry-run)
 *   npm run migrate-images --run  # Ejecutar migración real
 */

import pool from '../config/database';
import { processImage, generateUniqueFilename } from '../services/uploadService';
import path from 'path';
import fs from 'fs/promises';

interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  display_order: number;
  is_primary: boolean;
  alt_text?: string;
}

interface Product {
  id: number;
  slug: string;
  name: string;
}

const DRY_RUN = !process.argv.includes('--run');

/**
 * Convierte base64 a Buffer
 */
const base64ToBuffer = (base64: string): Buffer => {
  // Remover el prefijo data:image/...;base64,
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
};

/**
 * Verifica si una URL es base64
 */
const isBase64Image = (url: string): boolean => {
  return url.startsWith('data:image/');
};

/**
 * Migra una imagen de base64 a archivos
 */
const migrateImage = async (
  image: ProductImage,
  product: Product
): Promise<string | null> => {
  try {
    if (!isBase64Image(image.image_url)) {
      console.log(`  ⏭️  Imagen ${image.id} ya es un archivo (${image.image_url.substring(0, 50)}...)`);
      return null;
    }

    console.log(`  📸 Procesando imagen ${image.id}...`);

    // Convertir base64 a Buffer
    const buffer = base64ToBuffer(image.image_url);
    console.log(`     Tamaño del buffer: ${(buffer.length / 1024).toFixed(2)} KB`);

    // Generar nombre único
    const filename = generateUniqueFilename(`image-${image.id}`, product.slug);
    console.log(`     Nombre de archivo: ${filename}`);

    if (!DRY_RUN) {
      // Procesar imagen y generar 3 tamaños
      const paths = await processImage(buffer, filename);
      console.log(`     ✅ Archivos creados:`);
      console.log(`        - ${paths.thumbnail}`);
      console.log(`        - ${paths.medium}`);
      console.log(`        - ${paths.original}`);

      // Actualizar BD con la nueva ruta (medium)
      await pool.query(
        'UPDATE product_images SET image_url = $1 WHERE id = $2',
        [paths.medium, image.id]
      );

      return paths.medium;
    } else {
      console.log(`     [DRY-RUN] Se crearía: /uploads/products/medium/${filename}.jpg`);
      return `/uploads/products/medium/${filename}.jpg`;
    }
  } catch (error: any) {
    console.error(`  ❌ Error procesando imagen ${image.id}:`, error.message);
    return null;
  }
};

/**
 * Script principal
 */
const migrate = async () => {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 MIGRACIÓN DE IMÁGENES BASE64 → ARCHIVOS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  if (DRY_RUN) {
    console.log('⚠️  MODO DRY-RUN (no se harán cambios reales)');
    console.log('   Para ejecutar la migración real, usa: npm run migrate-images --run');
    console.log('');
  } else {
    console.log('▶️  EJECUTANDO MIGRACIÓN REAL');
    console.log('');
  }

  try {
    // Obtener todas las imágenes de productos
    const imagesResult = await pool.query<ProductImage>(`
      SELECT id, product_id, image_url, display_order, is_primary, alt_text
      FROM product_images
      ORDER BY product_id, display_order
    `);

    const images = imagesResult.rows;
    console.log(`📊 Total de imágenes en BD: ${images.length}`);
    console.log('');

    if (images.length === 0) {
      console.log('✅ No hay imágenes para migrar');
      return;
    }

    // Contar cuántas son base64
    const base64Images = images.filter(img => isBase64Image(img.image_url));
    console.log(`📦 Imágenes base64 a migrar: ${base64Images.length}`);
    console.log(`✅ Imágenes ya migradas: ${images.length - base64Images.length}`);
    console.log('');

    if (base64Images.length === 0) {
      console.log('✅ Todas las imágenes ya están migradas');
      return;
    }

    // Agrupar por producto
    const imagesByProduct = new Map<number, ProductImage[]>();
    for (const image of base64Images) {
      if (!imagesByProduct.has(image.product_id)) {
        imagesByProduct.set(image.product_id, []);
      }
      imagesByProduct.get(image.product_id)!.push(image);
    }

    console.log(`🏷️  Productos afectados: ${imagesByProduct.size}`);
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    let totalMigrated = 0;
    let totalErrors = 0;

    // Procesar cada producto
    for (const [productId, productImages] of imagesByProduct) {
      // Obtener datos del producto
      const productResult = await pool.query<Product>(
        'SELECT id, slug, name FROM products WHERE id = $1',
        [productId]
      );

      if (productResult.rows.length === 0) {
        console.log(`⚠️  Producto ${productId} no encontrado`);
        continue;
      }

      const product = productResult.rows[0];
      console.log(`📦 Producto #${productId}: ${product.name} (${product.slug})`);
      console.log(`   Imágenes: ${productImages.length}`);

      // Migrar cada imagen del producto
      for (const image of productImages) {
        const newPath = await migrateImage(image, product);
        if (newPath) {
          totalMigrated++;
        } else if (isBase64Image(image.image_url)) {
          totalErrors++;
        }
      }

      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESUMEN DE LA MIGRACIÓN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Imágenes migradas: ${totalMigrated}`);
    console.log(`❌ Errores: ${totalErrors}`);
    console.log(`⏭️  Ya migradas: ${images.length - base64Images.length}`);
    console.log(`📊 Total: ${images.length}`);
    console.log('');

    if (DRY_RUN) {
      console.log('⚠️  Esta fue una simulación (DRY-RUN)');
      console.log('   Para ejecutar la migración real, usa:');
      console.log('   npm run migrate-images --run');
    } else {
      console.log('✅ Migración completada');
      console.log('');
      console.log('💡 Recomendaciones:');
      console.log('   1. Verifica que las imágenes se muestren correctamente en la web');
      console.log('   2. Considera hacer un backup de la BD antes de eliminar datos base64');
      console.log('   3. Las imágenes están en: server/uploads/products/');
    }

    console.log('');
  } catch (error: any) {
    console.error('');
    console.error('❌ ERROR EN LA MIGRACIÓN:');
    console.error(error.message);
    console.error('');
    process.exit(1);
  } finally {
    await pool.end();
  }
};

// Ejecutar migración
migrate();
