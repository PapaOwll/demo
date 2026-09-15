module.exports = {
  root: true,
  env: {
    es2021: true,
  },
  parserOptions: {
    ecmaVersion: 2021, // or a later version
    // Only <script lang="ts"> blocks (and .ts files) use the TS parser;
    // plain JS SFCs keep using espree.
    parser: {
      js: 'espree',
      ts: '@typescript-eslint/parser',
    },
  },
  plugins: ['eslint-plugin-unicorn'],
  extends: [
    'plugin:unicorn/recommended',
    'airbnb-base',
    'plugin:vue/vue3-essential',
    'plugin:vue/vue3-strongly-recommended',
    'plugin:vue/vue3-recommended',
    'eslint:recommended',
    '@vue/prettier',
  ],
  rules: {
    'vue/html-self-closing': [
      'warn',
      {
        html: {
          void: 'always',
          normal: 'always',
          component: 'always',
        },
        svg: 'always',
        math: 'always',
      },
    ],
    'vue/component-name-in-template-casing': [
      'warn',
      'PascalCase',
      {
        registeredComponentsOnly: false,
        ignores: [],
      },
    ],
    'vue/multi-word-component-names': [
      'error',
      {
        ignores: ['index', 'Header', 'Sidebar'],
      },
    ],
    'import/extensions': [
      'error',
      'ignorePackages',
      { '': 'never', js: 'never', jsx: 'never', ts: 'never', tsx: 'never', vue: 'never' },
    ],
    'no-nested-ternary': 'off',
    'import/order': 'off',
    'import/no-unresolved': 'off',
    'import/no-extraneous-dependencies': ['warn'],
    'import/prefer-default-export': ['off'],
    'no-unused-expressions': 'off',
    'unicorn/no-null': 'off',
    'unicorn/filename-case': 'off',
    'unicorn/no-array-reduce': 'off',
    'unicorn/no-array-for-each': 'off',
    'unicorn/prevent-abbreviations': 'off',
    'unicorn/prefer-string-replace-all': 'off',
    'linebreak-style': 'off',
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@/base/*/index', '@/base/*/index.*'],
            message: 'Do not include /index in import path. Use @/base/Component instead.',
          },
        ],
      },
    ],
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.vue'],
      },
      alias: {
        map: [['@', './src']],
        extensions: ['.js', '.jsx', '.ts', '.vue'],
      },
    },
  },
  overrides: [
    {
      files: ['*.ts'],
      parser: '@typescript-eslint/parser',
    },
  ],
}
