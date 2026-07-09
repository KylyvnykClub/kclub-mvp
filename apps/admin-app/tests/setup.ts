import { mock } from 'bun:test';
import { JSDOM } from 'jsdom';

import { mockCookieStore } from './test-helpers/mock-cookies';

// Registered once here (preloaded before every test file) so `next/headers`
// resolves consistently across files. Bun's `mock.module` permanently
// overrides a specifier's resolution for the rest of the process the moment
// it's called — a second registration in an individual test file would win
// and silently break every other file that relies on this one.
mock.module('next/headers', () => ({
  cookies: () => Promise.resolve(mockCookieStore),
}));

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost:3001',
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
