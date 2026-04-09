import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    // Convention: tests are co-located with source files.
    // Do NOT create __tests__/ directories.
    include: ["src/**/*.test.{ts,tsx}"],
    globals: true,
  },
});
