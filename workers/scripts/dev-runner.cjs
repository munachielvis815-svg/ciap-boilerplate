const { spawn } = require('node:child_process');
const process = require('node:process');

const isWindows = process.platform === 'win32';
const children = [];

function startProcess(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    stdio: 'inherit',
    windowsHide: false,
    ...options,
  });

  children.push(child);

  child.on('error', (error) => {
    console.error(`[dev-runner] Failed to start "${command}":`, error);
    shutdown(1);
  });

  child.on('exit', (code) => {
    if (code && code !== 0) {
      shutdown(code);
    }
  });

  return child;
}

function startPnpm(args) {
  if (isWindows) {
    return startProcess('cmd.exe', ['/d', '/s', '/c', 'pnpm', ...args]);
  }

  return startProcess('pnpm', args);
}

function startNode(args) {
  return startProcess(process.execPath, args);
}

function shutdown(code = 0) {
  while (children.length > 0) {
    const child = children.pop();
    if (child && !child.killed) {
      child.kill('SIGINT');
    }
  }

  process.exit(code);
}

startPnpm([
  'exec',
  'swc',
  'main.ts',
  'src',
  '-d',
  'dist',
  '--config-file',
  '../.swcrc',
  '--watch',
]);

startPnpm([
  'exec',
  'swc',
  '../shared',
  '-d',
  'dist/shared',
  '--config-file',
  '../.swcrc',
  '--watch',
]);

startNode([
  '--watch',
  '-r',
  './register-paths.cjs',
  'dist/main.js',
]);

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
