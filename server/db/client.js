const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:./tattoo.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

/** Convert a libsql Row (array-like) to a plain object */
function rowToObj(row, columns) {
  if (!row) return null;
  const obj = {};
  columns.forEach((col, i) => { obj[col] = row[i]; });
  return obj;
}

/** Convert multiple rows to plain objects */
function rowsToObjs(rows, columns) {
  return rows.map(r => rowToObj(r, columns));
}

/** Shorthand: execute and return all rows as plain objects */
async function all(sql, args = []) {
  const result = await client.execute({ sql, args });
  return rowsToObjs(result.rows, result.columns);
}

/** Shorthand: execute and return first row as plain object */
async function get(sql, args = []) {
  const result = await client.execute({ sql, args });
  return rowToObj(result.rows[0] ?? null, result.columns);
}

/** Shorthand: execute without returning rows (INSERT/UPDATE/DELETE) */
async function run(sql, args = []) {
  return client.execute({ sql, args });
}

/** Run multiple statements in a write batch */
async function batch(statements) {
  return client.batch(statements, 'write');
}

module.exports = { client, all, get, run, batch };
