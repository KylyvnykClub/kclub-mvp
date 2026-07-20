import nextConfig from '@kclub/config/eslint/next';

export default [
  ...nextConfig,
  { ignores: ['.next/'] },
  {
    files: ['tests/**/*.test.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
