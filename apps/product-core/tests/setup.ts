import { mock } from 'bun:test';
import { JSDOM } from 'jsdom';
import { createElement } from 'react';

// server-only throws when window is defined; mock it so server modules load in tests
mock.module('server-only', () => ({}));

// bun resolves static image imports to a path string without width/height metadata,
// which next/image rejects; render a plain <img> in tests instead
mock.module('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    const { src, alt = '', priority: _priority, fill: _fill, ...rest } = props;
    const resolvedSrc =
      typeof src === 'string' ? src : ((src as { src?: string } | undefined)?.src ?? '');
    return createElement('img', { src: resolvedSrc, alt, ...rest });
  },
}));

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost:3000/en',
  pretendToBeVisual: true,
});

globalThis.window = dom.window as unknown as Window & typeof globalThis;
globalThis.document = dom.window.document;
globalThis.navigator = dom.window.navigator;
globalThis.Node = dom.window.Node;
globalThis.Element = dom.window.Element;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.SVGElement = dom.window.SVGElement;
globalThis.DocumentFragment = dom.window.DocumentFragment;
globalThis.Text = dom.window.Text;
globalThis.Comment = dom.window.Comment;
globalThis.Event = dom.window.Event;
globalThis.CustomEvent = dom.window.CustomEvent;
globalThis.KeyboardEvent = dom.window.KeyboardEvent;
globalThis.MouseEvent = dom.window.MouseEvent;
globalThis.DOMRect = dom.window.DOMRect;
globalThis.HTMLSpanElement = dom.window.HTMLSpanElement;
globalThis.HTMLDivElement = dom.window.HTMLDivElement;
globalThis.HTMLAnchorElement = dom.window.HTMLAnchorElement;
globalThis.HTMLButtonElement = dom.window.HTMLButtonElement;
