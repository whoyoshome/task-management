const fs = require('fs');
const path = require('path');

const outDir = path.resolve(__dirname, '..', 'libs', 'shared', 'api-types');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const outfile = path.join(outDir, 'openapi.d.ts');
if (!fs.existsSync(outfile)) {
  console.log(
    '[openapi] No generated types found. Run:\n  npm run openapi:types\n  (ensure API Gateway is running and OAPI_URL points to /api-json)'
  );
} else {
  console.log('[openapi] Types present at', outfile);
}
