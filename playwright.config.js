import { defineConfig, devices } from '@playwright/test';

const chromiumLaunchOptions = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {};

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 2,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4174',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 }, launchOptions: chromiumLaunchOptions } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 }, launchOptions: chromiumLaunchOptions } },
    { name: 'mobile-webkit', use: { ...devices['iPhone 13'], browserName: 'webkit', viewport: { width: 390, height: 844 } } }
  ],
  // Sprawdzamy pliki dostarczane na hosting, a nie wyłącznie katalog źródeł.
  webServer: {
    command: 'npm run build && node server.mjs dist',
    env: { PORT: '4174' },
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: false,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 1000 }
  }
});
