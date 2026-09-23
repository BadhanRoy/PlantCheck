import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// ═══════════════════════════════════════════════════════════════════════════
// SmartAgro Bot — Vite dev server configuration
// ═══════════════════════════════════════════════════════════════════════════

const DEV_SERVER_PORT = 5173;
const DEFAULT_API_TARGET = 'http://127.0.0.1:8000';


const LONG_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

export default defineConfig(({ mode }) => {
  // -------------------------------------------------------------------------
  // Load environment variables from frontend/.env (if present)
  // No prefix filter — we want VITE_API_TARGET regardless of prefix rules.
  // -------------------------------------------------------------------------
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_TARGET || DEFAULT_API_TARGET;

  // -------------------------------------------------------------------------
  // Do NOT auto-open the browser in CI, headless containers, or when the
  // developer explicitly opts out via VITE_NO_OPEN=1
  // -------------------------------------------------------------------------
  const isCI =
    !!process.env.CI ||
    !!process.env.CONTINUOUS_INTEGRATION ||
    process.env.VITE_NO_OPEN === '1';
  const shouldOpen = !isCI;

  return {
    plugins: [react()],

    server: {
      // ---- Port configuration ----
      port: DEV_SERVER_PORT,
      strictPort: false, // if 5173 is taken → 5174, 5175 …
      host: '127.0.0.1', // local-only; change to true to expose on LAN

      // ---- Auto-open browser ----
      open: shouldOpen,

      // ---- API proxy → FastAPI backend ----
      // All requests to /api/* are forwarded to the backend, so the browser
      // sees them as same-origin (no CORS issues in development).
      proxy: {
        '/api': {
          target: apiTarget,
          // Rewrite the Host header to match the target. Required for
          // correct behavior behind reverse proxies and for many backend
          // frameworks that validate Host.
          changeOrigin: true,
          // Client → proxy timeout (how long the browser can wait)
          timeout: LONG_TIMEOUT_MS,
          // Proxy → backend timeout (how long the backend can take)
          proxyTimeout: LONG_TIMEOUT_MS,
        },
      },

      // ---- File watcher ----
      // Skip static assets and generated folders. Prevents the Windows
      // EBUSY error when a JPEG/PNG is locked by another app, and reduces
      // CPU/disk churn.
      watch: {
        ignored: [
          '**/public/**',
          '**/*.jpg',
          '**/*.jpeg',
          '**/*.png',
          '**/*.webp',
          '**/*.gif',
          '**/*.ico',
          '**/.git/**',
          '**/node_modules/**',
          '**/dist/**',
          '**/.vite/**',
        ],
      },
    },

    // ---- Preview server (npm run preview after build) ----
    preview: {
      port: 4173,
      open: shouldOpen,
    },
  };
});