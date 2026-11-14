import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  testDir: '.', testMatch: '*.spec.js', fullyParallel: false, workers: 1, retries: 0,
  timeout: 30000, expect: { timeout: 10000 }, reporter: 'list', outputDir: '../../test-results/media-browser',
  use: { baseURL: 'http://127.0.0.1:5173', browserName: 'chromium', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 900 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort', cwd: fileURLToPath(new URL('../..', import.meta.url)), url: 'http://127.0.0.1:5173/tests/browser/fixture.html', timeout: 60000, reuseExistingServer: false },
});
