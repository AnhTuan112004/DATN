import { spawn, execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const isWin = process.platform === 'win32';

// Định vị trực tiếp binary Node của nodemon và vite để chạy trực tiếp không qua batch file cmd
const nodemonBin = [
  path.resolve(rootDir, 'backend/node_modules/nodemon/bin/nodemon.js'),
  path.resolve(rootDir, 'node_modules/nodemon/bin/nodemon.js'),
].find(fs.existsSync);

const viteBin = [
  path.resolve(rootDir, 'frontend/node_modules/vite/bin/vite.js'),
  path.resolve(rootDir, 'node_modules/vite/bin/vite.js'),
].find(fs.existsSync);

console.log('\x1b[36m%s\x1b[0m', '====================================================================');
console.log('\x1b[1m\x1b[32m%s\x1b[0m', '  🚀 PEOPLEINSIGHT AI — DEV SERVER (FULL-STACK)');
console.log('\x1b[36m%s\x1b[0m', '  📦 Backend:  http://localhost:5000  (Express & Nodemon)');
console.log('\x1b[36m%s\x1b[0m', '  💻 Frontend: http://localhost:5173  (React 19 & Vite HMR)');
console.log('\x1b[33m%s\x1b[0m', '  🛑 Bấm Ctrl + C để dừng tức thì toàn bộ dịch vụ (Không hỏi xác nhận).');
console.log('\x1b[36m%s\x1b[0m', '====================================================================\n');

let backendProcess = null;
let frontendProcess = null;
let isCleaningUp = false;

function startBackend() {
  if (isCleaningUp) return;
  const backendDir = path.resolve(rootDir, 'backend');

  // Gọi trực tiếp node.exe thay vì qua npm.cmd để triệt tiêu lời nhắc Terminate batch job của Windows
  backendProcess = spawn(process.execPath, [nodemonBin, 'src/server.js'], {
    cwd: backendDir,
    stdio: ['ignore', 'inherit', 'inherit'],
    shell: false,
  });

  backendProcess.on('close', (code) => {
    if (!isCleaningUp) {
      cleanup();
    }
  });
}

function startFrontend() {
  if (isCleaningUp) return;
  const frontendDir = path.resolve(rootDir, 'frontend');

  // Gọi trực tiếp node.exe thay vì qua npm.cmd
  frontendProcess = spawn(process.execPath, [viteBin], {
    cwd: frontendDir,
    stdio: ['ignore', 'inherit', 'inherit'],
    shell: false,
  });

  frontendProcess.on('close', (code) => {
    if (!isCleaningUp) {
      cleanup();
    }
  });
}

// Khởi chạy cả 2 dịch vụ
startBackend();
startFrontend();

function cleanup() {
  if (isCleaningUp) return;
  isCleaningUp = true;
  console.log('\n\x1b[32m%s\x1b[0m', '✅ Đã dừng toàn bộ dịch vụ và giải phóng cổng 5000 & 5173 thành công.');

  if (isWin) {
    try {
      if (backendProcess?.pid) {
        execSync(`taskkill /pid ${backendProcess.pid} /f /t 2>nul`, { stdio: 'ignore' });
      }
    } catch {}

    try {
      if (frontendProcess?.pid) {
        execSync(`taskkill /pid ${frontendProcess.pid} /f /t 2>nul`, { stdio: 'ignore' });
      }
    } catch {}
  } else {
    try { backendProcess?.kill('SIGKILL'); } catch {}
    try { frontendProcess?.kill('SIGKILL'); } catch {}
  }

  process.exit(0);
}

// Bắt phím Ctrl + C trực tiếp từ terminal (Raw Mode) và phím 'q' để ngắt ngay tức thì
if (process.stdin.isTTY) {
  try {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (key) => {
      // \u0003 là Ctrl + C, \u0004 là Ctrl + D, 'q', 'Q', 'x', 'X'
      if (key === '\u0003' || key === '\u0004' || key === 'q' || key === 'Q' || key === 'x' || key === 'X') {
        cleanup();
      }
    });
  } catch {}
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
