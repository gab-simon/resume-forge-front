import { defineConfig, devices } from "@playwright/test"

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173"

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    // The application picks its language from the browser. The specs find
    // elements by their English text, so the browser is fixed in English. A
    // spec that needs another language calls test.use({ locale }).
    locale: "en-US",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Starts the Vite dev server unless PLAYWRIGHT_BASE_URL points to a running app.
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "bun run dev --port 5173 --strictPort",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        env: {
          // The tests intercept every API request (see e2e/fixtures.ts), so
          // this URL only has to be valid. Nothing listens on it.
          VITE_API_URL: process.env.VITE_API_URL ?? "http://localhost:9000",
        },
      },
})
