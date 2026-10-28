// Runs the whole backend in one container for the free public demo: the
// three microservices on 127.0.0.1, then the gateway on $PORT once they are
// listening. If any process exits, everything stops so the host restarts
// the container. Production uses one container per service instead.
require('./database-url');
const { spawn } = require('child_process');
const readline = require('readline');

const READY_LINE = 'running via TCP';
const READY_TIMEOUT_MS = 180_000;
// Heap caps (MB) so four Node processes fit in a 512 MB instance.
const MS_HEAP_MB = process.env.DEMO_MS_HEAP_MB || '96';
const GATEWAY_HEAP_MB = process.env.DEMO_GATEWAY_HEAP_MB || '128';

const children = [];
let stopping = false;

function run(name, heapMb) {
  const child = spawn(
    process.execPath,
    [`--max-old-space-size=${heapMb}`, `dist/${name}/main.js`],
    { stdio: ['ignore', 'pipe', 'pipe'], env: process.env }
  );
  children.push(child);

  const lineListeners = [];
  for (const stream of [child.stdout, child.stderr]) {
    readline.createInterface({ input: stream }).on('line', (line) => {
      console.log(`[${name}] ${line}`);
      lineListeners.forEach((listener) => listener(line));
    });
  }

  child.on('exit', (code, signal) => {
    if (stopping) return;
    console.error(`[demo] ${name} exited (${signal ?? code}); stopping`);
    stop(1);
  });

  return {
    ready: () =>
      new Promise((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error(`${name} did not start in time`)),
          READY_TIMEOUT_MS
        );
        lineListeners.push((line) => {
          if (line.includes(READY_LINE)) {
            clearTimeout(timer);
            resolve();
          }
        });
      }),
  };
}

function stop(code) {
  stopping = true;
  for (const child of children) child.kill('SIGTERM');
  setTimeout(() => process.exit(code), 5_000).unref();
  Promise.all(
    children.map((c) => new Promise((resolve) => c.once('exit', resolve)))
  ).then(() => process.exit(code));
}

process.on('SIGTERM', () => stop(0));
process.on('SIGINT', () => stop(0));

async function main() {
  const services = ['auth-microservice', 'user-microservice', 'task-microservice'];
  // They run their migrations before listening, so the gateway only starts
  // (and the host only sees the port open) once the schema is ready.
  await Promise.all(services.map((name) => run(name, MS_HEAP_MB).ready()));
  console.log('[demo] microservices ready, starting the gateway');
  run('api-gateway', GATEWAY_HEAP_MB);
}

main().catch((error) => {
  console.error(`[demo] ${error.message}`);
  stop(1);
});
