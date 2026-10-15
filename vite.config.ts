import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react"
import { visualizer } from "rollup-plugin-visualizer"
import { defineConfig } from "vitest/config"

export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          // React changes far less often than application code. A separate
          // chunk keeps it in the browser cache across deploys.
          groups: [
            {
              name: "react",
              test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            },
          ],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  plugins: [
    // Must come before the React plugin. autoCodeSplitting moves each route's
    // component into its own chunk, so no route needs a manual .lazy.tsx file.
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
    // `bun run analyze` writes the bundle report to dist/stats.html.
    process.env.ANALYZE === "true" &&
      visualizer({ filename: "dist/stats.html", gzipSize: true }),
  ],
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    env: {
      VITE_API_URL: "http://api.test",
    },
  },
})
