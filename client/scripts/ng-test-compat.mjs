import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url));
const ngBin = join(currentDir, '..', 'node_modules', '.bin', process.platform === 'win32' ? 'ng.cmd' : 'ng');

const args = process.argv.slice(2).flatMap((arg) => {
  if (arg === '--browsers=ChromeHeadless') {
    return ['--browsers=chromium', '--headless=true'];
  }

  if (arg === '--browsers ChromeHeadless') {
    return ['--browsers=chromium', '--headless=true'];
  }

  return [arg];
});

const child = spawn(ngBin, ['test', ...args], {
  stdio: 'inherit',
  shell: false,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
