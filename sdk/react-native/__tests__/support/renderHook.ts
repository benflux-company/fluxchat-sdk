import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

/**
 * Minimal renderHook built on react-test-renderer.
 *
 * Deliberately not @testing-library/react-native: it pulls in React Native's
 * own .tsx internals, which the ts-jest/node setup here cannot transform, and
 * @testing-library/react is worse — it peers on react-dom, which npm resolves
 * to 19 and collides with the React 18 this package targets. The hook under
 * test renders no native component, so a probe component is enough.
 */
export function renderHook<T>(callback: () => T): {
  result: { current: T };
  rerender: () => void;
  unmount: () => void;
} {
  const result = { current: undefined as unknown as T };

  function Probe(): null {
    result.current = callback();
    return null;
  }

  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(React.createElement(Probe));
  });

  return {
    result,
    rerender: () => act(() => renderer.update(React.createElement(Probe))),
    unmount: () => act(() => renderer.unmount()),
  };
}

export { act };
