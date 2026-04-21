import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vitest/config";

function resolveProxyTarget(): string {
  if (process.env.VITE_API_PROXY_TARGET) {
    return process.env.VITE_API_PROXY_TARGET;
  }
  const statePath = path.resolve(__dirname, "../data/runtime/state.json");
  try {
    const raw = fs.readFileSync(statePath, "utf-8");
    const parsed = JSON.parse(raw) as { urls?: { backend?: string } };
    if (parsed.urls?.backend) {
      return parsed.urls.backend;
    }
  } catch {
    // Fall back to legacy default when runtime state is unavailable.
  }
  return "http://127.0.0.1:8000";
}

const proxyTarget = resolveProxyTarget();

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    css: true,
  },
});
