// Temporary preload — stubs Next-only modules.
import { plugin } from 'bun';

plugin({
  name: 'next-stubs',
  setup(build) {
    build.module('server-only', () => ({ exports: {}, loader: 'object' }));
  },
});
