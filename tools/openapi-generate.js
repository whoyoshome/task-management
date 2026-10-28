// Regenerates libs/shared/api-types/openapi.ts from the running gateway's
// OpenAPI spec. Set OAPI_URL to read it from somewhere else.
const { execFileSync } = require('child_process');
const path = require('path');

const url = process.env.OAPI_URL || 'http://localhost:3000/api/docs-json';
const output = path.join('libs', 'shared', 'api-types', 'openapi.ts');
const cli = require.resolve('openapi-typescript/bin/cli.js');

console.log(`[openapi] Fetching ${url}...`);
try {
  // A .ts file (not .d.ts) so it can be imported and re-exported.
  execFileSync(process.execPath, [cli, url, '-o', output], {
    stdio: 'inherit',
  });
} catch {
  console.error('[openapi] Generation failed.');
  process.exit(1);
}
console.log(`[openapi] Types generated at ${output}`);
