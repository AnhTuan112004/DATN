import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const OUT_DIR = path.resolve('docs/screenshots');
const ARTIFACT_DIR = 'C:\\Users\\nguye\\.gemini\\antigravity\\brain\\19853a59-9638-484e-b463-e1268422bd40';

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function capture() {
  console.log('🚀 Khởi chạy Chromium để chụp 4 góc nhìn Dashboard (Light/Dark x 1280/390)...');

  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. Đăng nhập qua API hoặc giao diện
  console.log('🔑 Đang đăng nhập tài khoản CEO...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });

  // Nhập tài khoản CEO demo
  await page.fill('input[type="email"]', 'ceo@peopleinsight.vn');
  await page.fill('input[type="password"]', 'Admin@123456');
  await page.click('button[type="submit"]');

  // Đợi chuyển hướng về dashboard
  await page.waitForURL('http://localhost:5173/', { timeout: 10000 });
  await page.waitForTimeout(1000);

  const targets = [
    { name: 'dashboard_light_1280.png', width: 1280, height: 900, theme: 'light', scrollY: 0 },
    { name: 'dashboard_dark_1280.png', width: 1280, height: 900, theme: 'dark', scrollY: 0 },
    { name: 'dashboard_light_1280_bottom.png', width: 1280, height: 900, theme: 'light', scrollY: 480 },
    { name: 'dashboard_dark_1280_bottom.png', width: 1280, height: 900, theme: 'dark', scrollY: 480 },
    { name: 'dashboard_light_390.png', width: 390, height: 844, theme: 'light', scrollY: 0 },
    { name: 'dashboard_dark_390.png', width: 390, height: 844, theme: 'dark', scrollY: 0 },
    { name: 'dashboard_light_390_bottom.png', width: 390, height: 844, theme: 'light', scrollY: 620 },
    { name: 'dashboard_dark_390_bottom.png', width: 390, height: 844, theme: 'dark', scrollY: 620 },
    { name: 'dashboard_light_390_tasks.png', width: 390, height: 844, theme: 'light', scrollY: 1400 },
    { name: 'dashboard_dark_390_tasks.png', width: 390, height: 844, theme: 'dark', scrollY: 1400 },
  ];

  for (const t of targets) {
    console.log(`📸 Chụp: ${t.name} (Viewport: ${t.width}x${t.height}, Theme: ${t.theme}, Scroll: ${t.scrollY})...`);
    await page.setViewportSize({ width: t.width, height: t.height });

    // Set theme
    await page.evaluate(({ theme, scrollY }) => {
      document.documentElement.dataset.theme = theme;
      localStorage.setItem('theme', theme);
      window.scrollTo(0, scrollY);
    }, { theme: t.theme, scrollY: t.scrollY });

    await page.waitForTimeout(600);

    const outPath = path.join(OUT_DIR, t.name);
    await page.screenshot({ path: outPath, fullPage: false });

    // Copy to artifact dir
    try {
      const artifactPath = path.join(ARTIFACT_DIR, t.name);
      fs.copyFileSync(outPath, artifactPath);
    } catch {}

    console.log(`✅ Lưu thành công: ${outPath}`);
  }

  await browser.close();
  console.log('🎉 Đã hoàn tất chụp 4 ảnh đối chứng chất lượng cao!');
}

capture().catch((err) => {
  console.error('❌ Lỗi khi chụp screenshot:', err);
  process.exit(1);
});

