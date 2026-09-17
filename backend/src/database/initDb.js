import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initDatabase() {
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  console.log('[InitDb] Applying database schema...');
  await db.executeScript(schemaSql);
  console.log('[InitDb] Database schema initialized successfully.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initDatabase()
    .then(() => {
      console.log('Database initialization complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Database initialization failed:', err);
      process.exit(1);
    });
}
