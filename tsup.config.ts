import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'components/index': 'src/components/index.ts',
    'types/index': 'src/types/index.ts',
    'style': 'src/style.css',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['react', 'react-dom'],
  minify: true,
});