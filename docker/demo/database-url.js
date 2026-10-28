// Expands DATABASE_URL (the connection string Neon gives) into the
// <PREFIX>_DB_* variables each service reads, so a deployment sets one
// value instead of fifteen. Schemas stay per service (<PREFIX>_DB_SCHEMA)
// and variables that are already set win. Loaded by start.js, or with
// NODE_OPTIONS=--require=./docker/demo/database-url.js for the seed.
const url = process.env.DATABASE_URL;

if (url) {
  const parsed = new URL(url);
  const values = {
    HOST: parsed.hostname,
    PORT: parsed.port || '5432',
    USERNAME: decodeURIComponent(parsed.username),
    PASSWORD: decodeURIComponent(parsed.password),
    NAME: decodeURIComponent(parsed.pathname.slice(1)),
  };
  for (const prefix of ['USER', 'TASK', 'AUTH']) {
    for (const [setting, value] of Object.entries(values)) {
      process.env[`${prefix}_DB_${setting}`] ??= value;
    }
  }
}
