import { defineConfig, Plugin, ViteDevServer } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import viteCompression from 'vite-plugin-compression';
import { sentryVitePlugin } from "@sentry/vite-plugin";
import type { IncomingMessage, ServerResponse } from 'http'
import fs from 'node:fs';
import { execSync } from "node:child_process";

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
const defaultDeployHost = 'win3bitco.in';

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

type BuildMetadata = {
  version: string;
  builtAtIso: string;
  commitSha: string;
  commitShortSha: string;
  commitUrl: string;
  branchName: string;
  deployHost: string;
};

function buildMetadataPlugin(buildMetadata: BuildMetadata): Plugin {
  return {
    name: 'build-metadata',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'build-info.json',
        source: JSON.stringify(buildMetadata, null, 2),
      });
    },
  };
}

function readPackageVersion(): string {
  const packageJsonPath = path.resolve(__dirname, 'package.json');
  const packageJsonRaw = fs.readFileSync(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageJsonRaw) as { version?: string };

  return packageJson.version ?? '0.0.0';
}

function maybeRunGitCommand(command: string): string | undefined {
  try {
    const output = execSync(command, {
      cwd: __dirname,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim();

    return output || undefined;
  } catch {
    return undefined;
  }
}

function normalizeGitHubRemote(remoteUrl: string | undefined): string | undefined {
  if (!remoteUrl) {
    return undefined;
  }

  const normalizedRemote = remoteUrl
    .replace(/^git@github\.com:/, 'https://github.com/')
    .replace(/^ssh:\/\/git@github\.com\//, 'https://github.com/')
    .replace(/\.git$/, '');

  if (!normalizedRemote.startsWith('https://github.com/')) {
    return undefined;
  }

  return normalizedRemote;
}

function resolveCommitSha(): string | undefined {
  return maybeRunGitCommand('git rev-parse HEAD')
    || process.env.GITHUB_SHA
    || process.env.GIT_COMMIT_SHA
    || process.env.VERCEL_GIT_COMMIT_SHA
    || process.env.CF_PAGES_COMMIT_SHA;
}

function normalizeBranchName(branchName: string | undefined): string | undefined {
  if (!branchName) {
    return undefined;
  }

  const normalizedBranchName = branchName
    .trim()
    .replace(/^refs\/heads\//, '')
    .replace(/^remotes\/origin\//, '')
    .replace(/^origin\//, '');

  if (!normalizedBranchName || normalizedBranchName === 'HEAD') {
    return undefined;
  }

  return normalizedBranchName;
}

function resolveBranchName(): string | undefined {
  return normalizeBranchName(
    process.env.GIT_BRANCH_NAME
      || process.env.GITHUB_REF_NAME
      || process.env.GITHUB_HEAD_REF
      || process.env.VERCEL_GIT_COMMIT_REF
      || process.env.CF_PAGES_BRANCH
      || maybeRunGitCommand('git branch --show-current')
      || maybeRunGitCommand("git for-each-ref --format='%(refname:short)' --points-at HEAD refs/heads refs/remotes/origin | head -n 1"),
  );
}

function resolveDeployHost(): string {
  return process.env.DEPLOY_HOST?.trim() || defaultDeployHost;
}

function resolveOriginRemote(): string | undefined {
  if (process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY) {
    return `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}`;
  }

  return process.env.GIT_REMOTE_URL || maybeRunGitCommand('git remote get-url origin');
}

function resolveBuildMetadata(): BuildMetadata {
  const version = readPackageVersion();
  const builtAtIso = new Date().toISOString();
  const maybeCommitSha = resolveCommitSha();
  const commitSha = maybeCommitSha ?? '';
  const commitShortSha = maybeRunGitCommand('git rev-parse --short=7 HEAD')
    || process.env.GIT_COMMIT_SHORT_SHA
    || maybeCommitSha?.slice(0, 7)
    || '';
  const maybeOriginRemote = resolveOriginRemote();
  const maybeGitHubRemote = normalizeGitHubRemote(maybeOriginRemote);
  const branchName = resolveBranchName() ?? '';
  const deployHost = resolveDeployHost();
  const commitUrl = maybeGitHubRemote && maybeCommitSha
    ? `${maybeGitHubRemote}/commit/${maybeCommitSha}`
    : '';

  return {
    version,
    builtAtIso,
    commitSha,
    commitShortSha,
    commitUrl,
    branchName,
    deployHost,
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const maybeHttpsConfig = command === 'serve' ? maybeLoadLocalHttpsConfig() : undefined;
  const shouldEnableSentryUpload = shouldUploadSourcemaps(mode);
  const buildMetadata = resolveBuildMetadata();

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
      buildMetadataPlugin(buildMetadata),
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
      // Try with bun run analyze
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
      'import.meta.env.PACKAGE_VERSION': JSON.stringify(buildMetadata.version),
      'import.meta.env.BUILD_TIME': JSON.stringify(buildMetadata.builtAtIso),
      'import.meta.env.GIT_COMMIT_SHA': JSON.stringify(buildMetadata.commitSha),
      'import.meta.env.GIT_COMMIT_SHORT_SHA': JSON.stringify(buildMetadata.commitShortSha),
      'import.meta.env.GIT_COMMIT_URL': JSON.stringify(buildMetadata.commitUrl),
      'import.meta.env.GIT_BRANCH_NAME': JSON.stringify(buildMetadata.branchName),
      'import.meta.env.DEPLOY_HOST': JSON.stringify(buildMetadata.deployHost),
    },
    // The below changes were added recently; might be unstable.
    esbuild: {
      jsx: 'automatic',
      jsxImportSource: 'react',
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
