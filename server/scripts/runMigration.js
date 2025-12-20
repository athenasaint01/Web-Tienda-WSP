/**
 * Script de migración para Railway PostgreSQL
 *
 * Este script ejecuta todas las migraciones necesarias en la base de datos de producción.
 * Ejecuta en orden:
 * 1. Schema principal (database/schema.sql)
 * 2. Tabla collections (database/EJECUTAR_EN_PGADMIN.sql)
 * 3. Campos de stock (database/migrations/001_add_stock_fields.sql)
 * 4. Seeds iniciales (database/seed.sql) - OPCIONAL
 */

// Cargar variables de entorno
require('dotenv').config();

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración de la conexión
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Ejecuta un archivo SQL
 */
async function executeSQLFile(filePath, description) {
  console.log(`\n📄 Ejecutando: ${description}`);
  console.log(`   Archivo: ${filePath}`);

  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    await pool.query(sql);
    console.log(`✅ ${description} - COMPLETADO`);
    return true;
  } catch (err) {
    console.error(`❌ ${description} - ERROR:`);
    console.error(`   ${err.message}`);
    return false;
  }
}

/**
 * Verifica si una tabla existe
 */
async function tableExists(tableName) {
  try {
    const result = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = $1
      );`,
      [tableName]
    );
    return result.rows[0].exists;
  } catch (err) {
    console.error(`Error al verificar tabla ${tableName}:`, err);
    return false;
  }
}

/**
 * Ejecuta las migraciones
 */
async function runMigrations() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 INICIANDO MIGRACIONES PARA RAILWAY DB');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // Verificar conexión
    console.log('\n🔌 Verificando conexión a PostgreSQL...');
    await pool.query('SELECT NOW()');
    console.log('✅ Conexión exitosa\n');

    // Verificar si las tablas ya existen
    const productsExists = await tableExists('products');
    const collectionsExists = await tableExists('collections');

    console.log('📊 Estado de la base de datos:');
    console.log(`   • Tabla products: ${productsExists ? '✓ Existe' : '✗ No existe'}`);
    console.log(`   • Tabla collections: ${collectionsExists ? '✓ Existe' : '✗ No existe'}`);

    // PASO 1: Schema principal (solo si no existe)
    if (!productsExists) {
      console.log('\n🏗️  PASO 1: Creando schema principal...');
      const schemaPath = path.join(__dirname, '../../database/schema.sql');
      const success = await executeSQLFile(schemaPath, 'Schema principal');
      if (!success) {
        console.log('\n⚠️  ADVERTENCIA: Error al crear schema. Continuando...');
      }
    } else {
      console.log('\n✓ PASO 1: Schema principal ya existe (OMITIDO)');
    }

    // PASO 2: Tabla collections (solo si no existe)
    if (!collectionsExists) {
      console.log('\n🏗️  PASO 2: Creando tabla collections y datos de ejemplo...');
      const collectionsPath = path.join(__dirname, '../../database/EJECUTAR_EN_PGADMIN.sql');
      const success = await executeSQLFile(collectionsPath, 'Tabla collections');
      if (!success) {
        console.log('\n⚠️  ADVERTENCIA: Error al crear collections. Continuando...');
      }
    } else {
      console.log('\n✓ PASO 2: Tabla collections ya existe (OMITIDO)');
    }

    // PASO 3: Migración de stock (siempre ejecutar - usa IF NOT EXISTS)
    console.log('\n🏗️  PASO 3: Agregando campos de stock...');
    const stockMigrationPath = path.join(__dirname, '../../database/migrations/001_add_stock_fields.sql');
    await executeSQLFile(stockMigrationPath, 'Campos de stock');

    // PASO 4: Seeds (OPCIONAL - comentado por defecto)
    // const seedPath = path.join(__dirname, '../../database/seed.sql');
    // if (fs.existsSync(seedPath)) {
    //   console.log('\n🏗️  PASO 4: Ejecutando seeds...');
    //   await executeSQLFile(seedPath, 'Seeds de datos iniciales');
    // }

    // Resumen final
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ MIGRACIONES COMPLETADAS EXITOSAMENTE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Verificar tablas creadas
    console.log('\n📊 Verificando tablas creadas:');
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    result.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`);
    });

    console.log('\n🎉 Base de datos lista para usar!\n');

  } catch (error) {
    console.error('\n❌ ERROR FATAL:', error);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Ejecutar migraciones
runMigrations();
