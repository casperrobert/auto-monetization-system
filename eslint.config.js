import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        console: 'readonly',
        process: 'readonly',
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        fetch: 'readonly',
        localStorage: 'readonly',
        Web3: 'readonly',
        $: 'readonly',
        getValue: 'readonly',
        sanitizeHtml: 'readonly',
        secureStorage: 'readonly',
        validators: 'readonly',
        notifications: 'readonly',
        secureApiRequest: 'readonly',
        rateLimiter: 'readonly',
        debounce: 'readonly',
        reportError: 'readonly',
        ERC20Token: 'readonly'
      }
    },
    rules: {
      indent: ['error', 2],
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
      'no-unused-vars': ['warn'],
      'no-console': ['warn'],
      'prefer-const': ['error'],
      'no-var': ['error'],
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'brace-style': ['error', '1tbs'],
      'comma-dangle': ['error', 'never'],
      'no-trailing-spaces': ['error'],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'space-before-function-paren': ['error', 'never'],
      'keyword-spacing': ['error'],
      'space-infix-ops': ['error'],
      'no-multiple-empty-lines': ['error', { max: 2 }],
      'eol-last': ['error'],
      'no-alert': ['warn'],
      'no-eval': ['error'],
      'no-implied-eval': ['error'],
      'no-new-func': ['error'],
      'no-script-url': ['error']
    },
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '*.min.js',
      'vendor/**',
      'coverage/**'
    ]
  }
];
