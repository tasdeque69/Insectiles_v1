import { query } from './pool.js';
import { schema, dropSchema } from './schema.js';
import pool from './pool.js';

export async function initializeDatabase() {
  try {
    console.log('📦 Creating database schema...');
    await query(schema);
    console.log('✅ Database schema created successfully');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
}

export async function resetDatabase() {
  try {
    console.log('⚠️  Dropping all tables...');
    await query(dropSchema);
    console.log('✅ Database reset complete');
    await initializeDatabase();
  } catch (error) {
    console.error('❌ Failed to reset database:', error);
    throw error;
  }
}

export async function testConnection() {
  try {
    const result = await query('SELECT NOW() as now');
    console.log('✅ Database connected:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

export async function closePool() {
  await pool.end();
}

export default {
  initializeDatabase,
  resetDatabase,
  testConnection,
  closePool,
};
