import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

console.log('\x1b[36m%s\x1b[0m', '====================================================================');
console.log('\x1b[1m\x1b[32m%s\x1b[0m', '  🚀 PEOPLEINSIGHT AI — DEV SERVER (FULL-STACK)');
console.log('\x1b[36m%s\x1b[0m', '  📦 Backend:  http://localhost:5000  (Express & Nodemon)');
console.log('\x1b[36m%s\x1b[0m', '  💻 Frontend: http://localhost:5173  (React 19 & Vite HMR)');
console.log('\x1b[33m%s\x1b[0m', '  🛑 Nhấn Ctrl + C để dừng đồng thời cả Backend và Frontend.');
console.log('\x1b[36m%s\x1b[0m', '====================================================================\n');

let backendProcess = null;
let frontendProcess = null;
let isCleaningUp = false;

function startBackend() {
  if (isCleaningUp) return;
  backendProcess = spawn(npmCmd, ['--prefix', 'backend', 'run', 'dev'], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
  });

  backendProcess.on('close', (code) => {
    if (!isCleaningUp) {
      console.warn(`\x1b[33m[Backend] Tiến trình backend vừa đóng (mã: ${code}). Đang tự động khởi động lại sau 1.5s...\x1b[0m`);
      setTimeout(startBackend, 1500);
    }
  });
}

function startFrontend() {
  if (isCleaningUp) return;
  frontendProcess = spawn(npmCmd, ['--prefix', 'frontend', 'run', 'dev'], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
  });

  frontendProcess.on('close', (code) => {
    if (!isCleaningUp) {
      console.warn(`\x1b[33m[Frontend] Tiến trình frontend vừa đóng (mã: ${code}). Đang tự động khởi động lại sau 1.5s...\x1b[0m`);
      setTimeout(startFrontend, 1500);
    }
  });
}

// Khởi chạy cả 2 dịch vụ
startBackend();
startFrontend();

function cleanup() {
  if (isCleaningUp) return;
  isCleaningUp = true;
  console.log('\n\x1b[33m%s\x1b[0m', '🛑 Đang dừng toàn bộ dịch vụ và giải phóng cổng 5000 & 5173...');

  if (isWin) {
    if (backendProcess?.pid) spawn('taskkill', ['/pid', backendProcess.pid.toString(), '/f', '/t'], { stdio: 'ignore' });
    if (frontendProcess?.pid) spawn('taskkill', ['/pid', frontendProcess.pid.toString(), '/f', '/t'], { stdio: 'ignore' });
  } else {
    try { backendProcess?.kill('SIGTERM'); } catch {}
    try { frontendProcess?.kill('SIGTERM'); } catch {}
  }

  setTimeout(() => process.exit(0), 400);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

