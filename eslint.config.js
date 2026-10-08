// ESLint flat config. Rules here enforce docs/CONVENTIONS.md automatically.
const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

const EM_DASH = String.fromCharCode(0x2014);
const COLOR_LITERAL = '/^(#[0-9a-fA-F]{3,8}|rgba?\\(|hsla?\\()/';

module.exports = defineConfig([
  globalIgnores(['dist/*', '.expo/*', 'android/*', 'ios/*', 'docs/v1-reference/*']),
  expoConfig,
  eslintPluginPrettierRecommended,

  // All source files
  {
    files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
    rules: {
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-restricted-syntax': [
        'error',
        {
          selector: `Literal[value=/${EM_DASH}/]`,
          message: 'No em-dashes. Use a comma, colon, full stop or brackets instead.',
        },
        {
          selector: `TemplateElement[value.raw=/${EM_DASH}/]`,
          message: 'No em-dashes. Use a comma, colon, full stop or brackets instead.',
        },
        {
          selector: `JSXText[value=/${EM_DASH}/]`,
          message: 'No em-dashes. Use a comma, colon, full stop or brackets instead.',
        },
      ],
    },
  },

  // App TypeScript: naming, imports, design-system rules
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'default', format: ['camelCase'], leadingUnderscore: 'allow' },
        {
          selector: 'variable',
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
        },
        { selector: 'function', format: ['camelCase', 'PascalCase'] },
        { selector: 'parameter', format: ['camelCase', 'PascalCase'], leadingUnderscore: 'allow' },
        { selector: 'typeLike', format: ['PascalCase'] },
        { selector: 'enumMember', format: ['PascalCase'] },
        // Object keys can be style names, font family names, HTTP headers and so on.
        { selector: ['objectLiteralProperty', 'typeProperty'], format: null },
        { selector: 'import', format: null },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native',
              importNames: ['Text'],
              message: 'Use Txt from @/components/Txt so text gets the theme font and colour.',
            },
          ],
          patterns: [
            {
              group: ['@/theme/*'],
              message: "Import from '@/theme' (the public API), not files inside it.",
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: `Literal[value=/${EM_DASH}/]`,
          message: 'No em-dashes. Use a comma, colon, full stop or brackets instead.',
        },
        {
          selector: `TemplateElement[value.raw=/${EM_DASH}/]`,
          message: 'No em-dashes. Use a comma, colon, full stop or brackets instead.',
        },
        {
          selector: `JSXText[value=/${EM_DASH}/]`,
          message: 'No em-dashes. Use a comma, colon, full stop or brackets instead.',
        },
        {
          selector: `Literal[value=${COLOR_LITERAL}]`,
          message: 'No hard-coded colours. Use a colour role from the theme (theme.colors.*).',
        },
      ],
      'import/no-default-export': 'error',
    },
  },

  // The theme is where colours are defined.
  {
    files: ['src/theme/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: `Literal[value=/${EM_DASH}/]`,
          message: 'No em-dashes. Use a comma, colon, full stop or brackets instead.',
        },
      ],
      'no-restricted-imports': 'off',
    },
  },

  // Expo Router needs a default export from every route file.
  {
    files: ['src/app/**/*.{ts,tsx}'],
    rules: { 'import/no-default-export': 'off' },
  },

  // Tests may name things freely and use fixture colours.
  {
    files: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': 'off',
      '@typescript-eslint/naming-convention': 'off',
    },
  },
]);
