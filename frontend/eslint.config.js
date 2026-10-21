import react from 'eslint-plugin-react';
import globals from 'globals';
export default [{
  files: ['src/**/*.{js,jsx}'],
  languageOptions: { ecmaVersion: 2023, sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } }, globals: { ...globals.browser } },
  plugins: { react },
  rules: { 'no-undef': 'error', 'react/jsx-no-undef': 'error', 'react/jsx-uses-vars': 'error', 'no-unused-vars': ['warn', { varsIgnorePattern: '^_', args: 'none' }], 'react/jsx-key': 'warn' },
}];
