import { createElement } from 'react';
import { vi } from 'vitest';

// server-only is aliased to an empty stub in vitest.config.ts so server modules
// load under jsdom; the JSDOM globals themselves come from environment: 'jsdom'.

// Static image imports resolve without width/height metadata in tests, which
// next/image rejects; render a plain <img> instead.
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    const { src, alt = '', priority: _priority, fill: _fill, ...rest } = props;
    const resolvedSrc =
      typeof src === 'string' ? src : ((src as { src?: string } | undefined)?.src ?? '');
    return createElement('img', { src: resolvedSrc, alt, ...rest });
  },
}));
