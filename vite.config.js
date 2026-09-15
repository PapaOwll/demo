/* eslint-disable import/no-extraneous-dependencies */
import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'
import vueDevTools from 'vite-plugin-vue-devtools'
import { visualizer } from 'rollup-plugin-visualizer'
import { quasar } from '@quasar/vite-plugin'

// Version source of truth: APP_VERSION injected at build time (from the git tag in CI).
// package.json is only a fallback for local dev where APP_VERSION is not set.
const pkg = JSON.parse(readFileSync('./package.json', 'utf8'))
const appVersion = process.env.APP_VERSION || pkg.version

export default defineConfig(({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) }

  const isAnalyzeMode = mode === 'analyze'

  // Subpath deployments (e.g. GitHub Pages project sites) set VITE_BASE_PATH
  // to their subpath (like '/demo/'); root deployments leave it unset.
  const basePath = process.env.VITE_BASE_PATH || '/'

  return {
    base: basePath,
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
    },
    build: {
      target: ['chrome64', 'firefox67', 'safari11.1', 'edge79'],
      sourcemap: false,
    },
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
      __BUILD_ID__: JSON.stringify(Date.now().toString()),
    },
  }
})
