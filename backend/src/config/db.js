import sqlite3 from 'sqlite3';
import pg from 'pg';
import mysql from 'mysql2/promise';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isPostgres = Boolean(process.env.DATABASE_URL);
const isMySQL = Boolean(process.env.MYSQL_HOST || process.env.MYSQL_URL || process.env.DB_TYPE === 'mysql');

let pgPool = null;
let mysqlPool = null;
let sqliteDb = null;

if (isPostgres) {
  console.log('[DB] Connecting to PostgreSQL via DATABASE_URL...');
  pgPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
} else if (isMySQL) {
  console.log(`[DB] Connecting to MySQL at ${process.env.MYSQL_HOST || 'localhost'}:${process.env.MYSQL_PORT || 3306}, Database: ${process.env.MYSQL_DATABASE || 'rescuebites'}...`);
  mysqlPool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'rescuebites',
    waitForConnections: true,
    connectionLimit: 10,
    decimalNumbers: true
  });
} else {
  const dataDir = path.resolve(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const dbPath = path.resolve(dataDir, 'marketplace.db');
  console.log(`[DB] Using SQLite database at: ${dbPath}`);
  sqliteDb = new sqlite3.Database(dbPath);
  // Enable foreign keys in SQLite
  sqliteDb.run('PRAGMA foreign_keys = ON');
}

/**
 * Universal query runner: accepts standard parameterized SQL.
 * Converts Postgres $1, $2 to ? for SQLite and MySQL.
 * Always returns an array of result rows.
 */
export async function query(sql, params = []) {
  if (isPostgres) {
    const client = await pgPool.connect();
    try {
      const res = await client.query(sql, params);
      return res.rows;
    } finally {
      client.release();
    }
  } else if (isMySQL) {
    let mysqlSql = sql.replace(/\$(\d+)/g, '?');
    const [rows] = await mysqlPool.query(mysqlSql, params);
    if (Array.isArray(rows)) {
      return rows;
    }
    return rows ? [rows] : [];
  } else {
    return new Promise((resolve, reject) => {
      let sqliteSql = sql.replace(/\$(\d+)/g, '?');
      const isSelect = /^\s*(SELECT|PRAGMA)/i.test(sqliteSql);

      if (isSelect) {
        sqliteDb.all(sqliteSql, params, (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        });
      } else {
        sqliteDb.run(sqliteSql, params, function (err) {
          if (err) return reject(err);
          resolve({ lastID: this.lastID, changes: this.changes });
        });
      }
    });
  }
}

/**
 * Execute raw multi-statement SQL (e.g., schema migration scripts)
 */
export async function executeScript(sqlContent) {
  if (isPostgres) {
    const client = await pgPool.connect();
    try {
      await client.query(sqlContent);
    } finally {
      client.release();
    }
  } else if (isMySQL) {
    const connection = await mysqlPool.getConnection();
    try {
      await connection.query(sqlContent);
    } finally {
      connection.release();
    }
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.exec(sqlContent, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
}

export default {
  query,
  executeScript,
  isPostgres,
  isMySQL
};
