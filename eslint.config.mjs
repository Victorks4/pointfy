import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    '.next/**',
    'node_modules/**',
    'reports/**',
    'out/**',
    'coverage/**',
  ]),
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    rules: {
      'no-unused-vars': 'off',
    },
  },
])
