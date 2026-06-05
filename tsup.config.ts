import { defineConfig } from 'tsup';

export default defineConfig([
  {
    // Core library: dual ESM + CJS with type declarations.
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    outExtension({ format }) {
      return { js: format === 'cjs' ? '.cjs' : '.js' };
    },
  },
  {
    // Widget (bundler/ESM + CJS consumers) with types.
    entry: { 'widget/index': 'src/widget/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: false,
    outExtension({ format }) {
      return { js: format === 'cjs' ? '.cjs' : '.js' };
    },
  },
  {
    // Widget global build for <script> embedding (window.FluxChatWidget).
    // IIFE format appends ".global.js", yielding dist/widget.global.js.
    entry: { widget: 'src/widget/global.ts' },
    format: ['iife'],
    globalName: 'FluxChatWidget',
    minify: true,
    sourcemap: true,
    clean: false,
    platform: 'browser',
  },
  {
    // CLI: ESM only, with a shebang so it runs as a binary.
    entry: { 'cli/index': 'src/cli/index.ts' },
    format: ['esm'],
    sourcemap: true,
    clean: false,
    banner: { js: '#!/usr/bin/env node' },
  },
]);
