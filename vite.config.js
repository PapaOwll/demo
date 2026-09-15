/* eslint-disable import/no-extraneous-dependencies */
import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'
import vueDevTools from 'vite-plugin-vue-devtools'
import { visualizer } from 'rollup-plugin-visualizer'
// GlitchTip speaks the Sentry release/artifact API, so the Sentry vite plugin is used
// as the source map uploader, pointed at the GlitchTip instance.
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { quasar } from '@quasar/vite-plugin'

// Version source of truth: APP_VERSION injected at build time (from the git tag in CI).
// package.json is only a fallback for local dev where APP_VERSION is not set.
const pkg = JSON.parse(readFileSync('./package.json', 'utf8'))
const appVersion = process.env.APP_VERSION || pkg.version

export default defineConfig(({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) }

  const isAnalyzeMode = mode === 'analyze'

  // Source maps are only emitted when they can actually be uploaded, so that build
  // artifacts are never left behind and served publicly by nginx.
  const glitchtipAuthToken = process.env.VITE_GLITCHTIP_AUTH_TOKEN
  const shouldUploadSourcemaps = mode === 'production' && Boolean(glitchtipAuthToken)

  return {
    plugins: [
      vue(),
      vueJsx(),
      vueDevTools(),
      isAnalyzeMode &&
        visualizer({
          open: true,
          gzipSize: true,
          brotliSize: true,
          // options =  ['network', 'treemap', 'sunburst', 'raw-data', 'list','flamegraph']
          template: 'treemap',
        }),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'public',
        filename: 'sw.js',
        injectRegister: false,
        manifest: false,
        injectManifest: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
          globIgnores: ['**/node_modules/**', 'sw.js', 'sw.js.map'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        },
      }),
      // Upload source maps to GlitchTip - production builds only, and only when an
      // auth token is provided (see VITE_GLITCHTIP_AUTH_TOKEN in .env.example)
      shouldUploadSourcemaps &&
        sentryVitePlugin({
          org: process.env.VITE_GLITCHTIP_ORG || 'sitra',
          project: process.env.VITE_GLITCHTIP_PROJECT || 'crm-sitra-front',
          telemetry: false,
          url: process.env.VITE_GLITCHTIP_URL || 'https://glitchtip.signaldev.ir/',
          authToken: glitchtipAuthToken,
          // Enable Debug ID injection
          debug: false,
          sourcemaps: {
            assets: './dist/**',
            ignore: ['node_modules', 'public'],
            filesToDeleteAfterUpload: ['./dist/**/*.map'],
          },
          // GlitchTip implements release creation and artifact upload, but not the
          // commit association / artifact cleanup APIs - so those are left off.
          release: {
            name: appVersion,
          },
          // Never fail a deploy because the monitoring backend is unreachable
          errorHandler: (error) => {
            // eslint-disable-next-line no-console
            console.warn('[glitchtip] source map upload skipped:', error.message)
          },
        }),
      // @quasar/plugin-vite options list:
      // https://github.com/quasarframework/quasar/blob/dev/vite-plugin/index.d.ts
      quasar({
        sassVariables: '@/assets/styles/colors.scss',
        autoImportComponentCase: 'pascal',
      }),
    ],
    envPrefix: 'VITE',
    resolve: {
      mainFields: ['browser', 'module', 'main', 'jsnext:main', 'jsnext'],
      extensions: ['.mjs', '.js', '.mts', '.ts', '.json', '.vue'],
      alias: {
        '@': fileURLToPath(new URL('src', import.meta.url)),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          additionalData: '@use "@/assets/styles/global.scss" as *;',
        },
      },
    },
    server: {
      cors: false,
      // node_modules is a symlink to the sibling crm-sitra-front checkout,
      // so dev-serving /@fs/ assets (e.g. the Quasar material-icons webfont)
      // requires allowing the parent workspace directory too.
      fs: {
        allow: [
          fileURLToPath(new URL('.', import.meta.url)),
          fileURLToPath(new URL('..', import.meta.url)),
        ],
      },
      proxy:
        process.env.NODE_ENV === 'production'
          ? undefined
          : {
              '/api': {
                secure: false,
                changeOrigin: true,
                target: process.env.VITE_API_PROXY_URL,
                rewrite: (_path) => _path.replace(/^\/api/, ''),
              },
            },
    },
    build: {
      target: ['chrome64', 'firefox67', 'safari11.1', 'edge79'],
      // 'hidden' keeps the sourceMappingURL comment out of the shipped bundles;
      // the uploader pairs files via injected Debug IDs instead.
      sourcemap: shouldUploadSourcemaps ? 'hidden' : false,
    },
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
      __BUILD_ID__: JSON.stringify(Date.now().toString()),
    },
  }
})
