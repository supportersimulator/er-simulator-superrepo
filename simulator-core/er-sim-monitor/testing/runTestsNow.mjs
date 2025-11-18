// Simple ESM wrapper to run tests
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const testScript = join(__dirname, 'tools', 'runFullTestSuite.cjs');

console.log('🚀 Launching Full Test Suite...\n');

const child = spawn('node', [testScript], {
  cwd: __dirname,
  stdio: 'inherit'
});

child.on('exit', (code) => {
  process.exit(code);
});
