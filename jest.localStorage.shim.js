'use strict';
// Cursor/sandbox Node can throw when accessing globalThis.localStorage. Define a stub before Jest runs.
const stub = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  get length() { return 0; },
  key: () => null,
};
try {
  if (typeof globalThis.localStorage === 'undefined')
    globalThis.localStorage = stub;
} catch (_) {
  Object.defineProperty(globalThis, 'localStorage', { value: stub, writable: true, configurable: true });
}
