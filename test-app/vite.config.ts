import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import babelPluginDebugLabel from '../src/babel-plugin';

export default defineConfig({
  base: '/react-debug-inspector/',
  plugins: [
    react({
      babel: {
        plugins: [babelPluginDebugLabel],
      },
    }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
