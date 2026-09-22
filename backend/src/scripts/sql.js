import readline from 'readline';
import db from '../config/db.js';

async function runQuery(sql) {
  const trimmed = sql.trim().replace(/;$/, '');
  if (!trimmed) return;
  try {
    const rows = await db.query(trimmed);
    if (Array.isArray(rows) && rows.length > 0) {
      console.table(rows);
      console.log(`(${rows.length} row${rows.length > 1 ? 's' : ''})\n`);
    } else {
      console.log('Query executed successfully. Result:', rows, '\n');
    }
  } catch (error) {
    console.error('SQL Error:', error.message, '\n');
  }
}

async function main() {
  const queryArg = process.argv.slice(2).join(' ').trim();

  if (queryArg) {
    await runQuery(queryArg);
    process.exit(0);
  }

  console.log(`
=====================================================
  RescueBites SQL Console (${db.isPostgres ? 'PostgreSQL' : 'SQLite'})
  Type any SQL query and press Enter.
  Type 'tables' to list all tables.
  Type 'exit' or 'quit' to close.
=====================================================
`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'SQL> '
  });

  rl.prompt();

  rl.on('line', async (line) => {
    const cmd = line.trim();
    if (cmd.toLowerCase() === 'exit' || cmd.toLowerCase() === 'quit') {
      rl.close();
      process.exit(0);
    }

    if (cmd.toLowerCase() === 'tables') {
      if (db.isPostgres) {
        await runQuery("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
      } else {
        await runQuery("SELECT name AS table_name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
      }
      rl.prompt();
      return;
    }

    if (cmd) {
      await runQuery(cmd);
    }
    rl.prompt();
  });
}

main();
