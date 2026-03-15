import { defineConfig, Plugin, ViteDevServer } from "vite";
import packageVersion from 'vite-plugin-package-version';
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';
import { sentryVitePlugin } from "@sentry/vite-plugin";
import type { IncomingMessage, ServerResponse } from 'http'
import fs from 'node:fs';

const logRequestsPlugin: Plugin = {
  name: 'log-requests',
  configureServer(server: ViteDevServer) {
    server.middlewares.use(
      (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const now = new Date().toISOString()
        const method = req.method ?? 'UNKNOWN'
        const url = req.url ?? 'UNKNOWN'
        const userAgent = req.headers['user-agent'] ?? 'UNKNOWN'
        if(url !== '/') {
          return next();
        }
        console.log(`[${now}] ${clientIp} ${method} ${url} ${userAgent}`)
        next()
      }
    )
  }
};

// https://chatgpt.com/c/68605d68-0dec-8002-806c-a3d988076c2b
const certPath = path.resolve(__dirname, '192.168.0.31.pem');
const keyPath = path.resolve(__dirname, '192.168.0.31-key.pem');

function maybeLoadLocalHttpsConfig() {
  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    return undefined;
  }

  return {
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath),
  };
}

function shouldUploadSourcemaps(mode: string): boolean {
  if (mode !== 'production' || process.env.ENABLE_SENTRY_UPLOAD !== '1') {
    return false;
  }

  if (!process.env.SENTRY_AUTH_TOKEN) {
    console.warn('ENABLE_SENTRY_UPLOAD=1 was set, but SENTRY_AUTH_TOKEN is missing. Skipping Sentry source map upload.');
    return false;
  }

  return true;
}

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const maybeHttpsConfig = command === 'serve' ? maybeLoadLocalHttpsConfig() : undefined;
  const shouldEnableSentryUpload = shouldUploadSourcemaps(mode);

  return {
    server: {
      host: "::",
      port: 8085,
      // https://chatgpt.com/c/68605d68-0dec-8002-806c-a3d988076c2b
      // Serving localhost over https so that apis such as crypto.subtle work; they only work in a secure context.
      ...(maybeHttpsConfig ? { https: maybeHttpsConfig } : {}),
    },
    plugins: [
      react(),
      mode === 'development' &&
        componentTagger(),
      packageVersion(),
      nodePolyfills({
        include: ['buffer', 'process'],
        globals: {
          Buffer: true,
          process: true,
        },
      }),
      // Compression plugin for production builds
      mode === 'production' && viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 10240, // Only compress files larger than 10kb
      }),
      mode === 'production' && viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 10240,
      }),
      // Bundle analyzer - generates stats.html after build
      // Try with pnpm run analyze
      // mode === 'production' && visualizer({
      //   filename: 'dist/stats.html',
      //   open: true,
      //   gzipSize: true,
      //   brotliSize: true,
      //   template: 'treemap', // or 'sunburst', 'network', 'raw-data'
      // }),
      // Put the Sentry vite plugin after all other plugins
      shouldEnableSentryUpload && sentryVitePlugin({
        org: "bright-builds-llc",
        project: "win3bitcoin",
        authToken: process.env.SENTRY_AUTH_TOKEN,
      }),
      logRequestsPlugin,
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      'import.meta.env.BUILD_TIME': JSON.stringify(new Date().toISOString()),
    },
    // The below changes were added recently; might be unstable.
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    },
    build: {
      target: 'es2020',
      minify: 'esbuild',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
            utils: ['clsx', 'tailwind-merge', 'class-variance-authority'],
            crypto: ['bitcoinjs-lib', 'bitcore-lib'],
          },
          chunkFileNames: (chunkInfo) => {
            // Unused? Thanks AI.
            const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
            return `js/[name]-[hash].js`;
          },
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split('.') || [];
            const ext = info[info.length - 1];
            if (/\.(css)$/.test(assetInfo.name || '')) {
              return `css/[name]-[hash].${ext}`;
            }
            if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(assetInfo.name || '')) {
              return `images/[name]-[hash].${ext}`;
            }
            return `assets/[name]-[hash].${ext}`;
          },
        },
      },
      chunkSizeWarningLimit: 1000,
      // Ensure workers are properly handled in production
      // assetsInlineLimit: 0, // Don't inline workers
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@radix-ui/react-dialog',
        '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-tabs',
        'clsx',
        'tailwind-merge',
        'class-variance-authority',
      ],
    },
  };
});
