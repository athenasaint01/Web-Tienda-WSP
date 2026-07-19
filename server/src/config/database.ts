import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Configuración del pool de conexiones PostgreSQL
// Prioriza DATABASE_URL (Railway/producción) sobre variables individuales
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'bd_sh0p4l4h45',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
);

// Event listeners para debugging
pool.on('connect', () => {
  console.log('✅ Nueva conexión establecida con PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en el pool de PostgreSQL:', err);
  process.exit(-1);
});

// Función helper para queries
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    if (process.env.NODE_ENV !== 'production') {
      const duration = Date.now() - start;
      console.log('📊 Query ejecutado', { duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('❌ Error en query:', { text, error });
    throw error;
  }
};

// Función para verificar conexión
export const testConnection = async (): Promise<boolean> => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Conexión a PostgreSQL exitosa:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Error al conectar a PostgreSQL:', error);
    return false;
  }
};

// Función para cerrar el pool (útil para testing)
export const closePool = async () => {
  await pool.end();
  console.log('🔌 Pool de conexiones cerrado');
};

export default pool;
