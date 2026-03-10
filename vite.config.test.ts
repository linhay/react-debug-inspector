import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import babelPluginDebugLabel from './src/babel-plugin.ts';

export default defineConfig({
  root: './test-app',
  plugins: [
    react({
      babel: {
        plugins: [babelPluginDebugLabel],
      },
    }),
  ],
  server: {
    port: 5173,
  },
});
