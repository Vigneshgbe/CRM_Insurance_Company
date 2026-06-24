import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '3306'),
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'padak_insurance_crm',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           '+05:30',
  dateStrings:        true,
});

export async function testConnection(): Promise<void> {
  try {
    const conn = await pool.getConnection();
    console.log(`✅ MySQL connected to ${process.env.DB_NAME || 'padak_insurance_crm'}`);
    conn.release();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err);
    process.exit(1);
  }
}

export default pool;
