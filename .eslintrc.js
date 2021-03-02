module.exports = {
  root: true,
  extends: [
    'react-app',
    'react-app/jest',
    'eslint:recommended',
    'prettier',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  globals: {
    logger: 'readonly',
  },
  rules: {
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    'no-restricted-globals': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    'no-useless-computed-key': 'off',
    'prefer-const': 'warn',
    'import/no-anonymous-default-export': 'off',
    'no-console': 'warn',
    '@typescript-eslint/no-extra-semi': 'off',
    'semi-style': ['error', 'first'],
    'no-async-promise-executor': 'off',
    'no-sequences': 'off',
    '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    'no-debugger': 'warn',
    'no-constant-condition': 'warn',
    '@typescript-eslint/ban-types': ['warn', { types: { '{}': false } }],
  },
}
