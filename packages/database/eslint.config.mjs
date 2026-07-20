import baseConfig from '@kclub/config/eslint/base';

export default [
  ...baseConfig,
  { ignores: ['dist/', 'src/generated/client/'] },
];
