const path = require('node:path');

/** @type {import('@storybook/vue3-vite').StorybookConfig} */
module.exports = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)', '../src/**/*.mdx'],
  staticDirs: ['../public'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-mdx-gfm',
  ],
  framework: {
    name: '@storybook/vue3-vite',
    options: {},
  },
  docs: {
    autodocs: true,
  },
  viteFinal: async (config) => {
    const resolvedConfig = { ...config };

    resolvedConfig.build = resolvedConfig.build || {};
    resolvedConfig.build.target = 'es2020';

    resolvedConfig.optimizeDeps = resolvedConfig.optimizeDeps || {};
    resolvedConfig.optimizeDeps.esbuildOptions =
      resolvedConfig.optimizeDeps.esbuildOptions || {};
    resolvedConfig.optimizeDeps.esbuildOptions.target = 'es2020';

    resolvedConfig.resolve = resolvedConfig.resolve || {};
    resolvedConfig.resolve.alias = {
      ...(resolvedConfig.resolve.alias || {}),
      '@': path.resolve(__dirname, '../src'),
    };

    resolvedConfig.css = resolvedConfig.css || {};
    resolvedConfig.css.preprocessorOptions = resolvedConfig.css.preprocessorOptions || {};
    resolvedConfig.css.preprocessorOptions.scss =
      resolvedConfig.css.preprocessorOptions.scss || {};
    resolvedConfig.css.preprocessorOptions.scss.additionalData =
      '@use "@/assets/styles/global.scss" as *;';

    resolvedConfig.define = {
      ...(resolvedConfig.define || {}),
      __APP_VERSION__: JSON.stringify('storybook'),
    };

    return resolvedConfig;
  },
};
