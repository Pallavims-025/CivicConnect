import 'dotenv/config';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const apiPort = process.env.PORT || '5000';
let apiAlreadyRunning = false;

try {
  const response = await fetch('http://127.0.0.1:' + apiPort + '/api/health', {
    signal: AbortSignal.timeout(1200),
  });
  apiAlreadyRunning = response.status === 200 || response.status === 503;
} catch {
  // Start the local API below if no server answers the health endpoint.
}

const children = [];
if (apiAlreadyRunning) {
  console.log('[CivicConnect] Reusing API at http://localhost:' + apiPort);
} else {
  children.push({
    name: 'API',
    child: spawn(process.execPath, ['backend/server.js'], { cwd: projectRoot, stdio: 'inherit' }),
  });
}

children.push({
  name: 'Vite',
  child: spawn(process.execPath, ['node_modules/vite/bin/vite.js'], { cwd: projectRoot, stdio: 'inherit' }),
});

let stopping = false;

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const { child } of children) {
    if (!child.killed) child.kill('SIGINT');
  }
  setTimeout(() => process.exit(code), 500).unref();
}

for (const { name, child } of children) {
  child.on('error', (error) => {
    console.error('[CivicConnect] ' + name + ' failed to start:', error.message);
    stop(1);
  });
  child.on('exit', (code, signal) => {
    if (!stopping) {
      console.error('[CivicConnect] ' + name + ' stopped (' + (signal || code) + ').');
      stop(code || 1);
    }
  });
}
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));

