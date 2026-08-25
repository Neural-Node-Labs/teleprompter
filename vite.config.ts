import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        // Main process entry — resolved from the project root, NOT from
        // vite's `root` (which is set to src/renderer below).
        entry: path.resolve(__dirname, 'src/main/index.ts'),
        vite: {
          build: {
            outDir: path.resolve(__dirname, 'dist-electron/main'),
            rollupOptions: {
              // 'ws' has optional native deps (bufferutil, utf-8-validate)
              // that aren't installed and aren't required for it to work.
              // Marking them external means they're require()'d at runtime
              // from node_modules instead of being bundled at build time,
              // which avoids the "could not resolve" build error.
              external: ['ws', 'bufferutil', 'utf-8-validate', 'electron-store'],
            },
          },
        },
      },
      {
        // Preload script
        entry: path.resolve(__dirname, 'src/preload/index.ts'),
        onstart(options) {
          options.reload();
        },
        vite: {
          build: {
            outDir: path.resolve(__dirname, 'dist-electron/preload'),
          },
        },
      },
    ]),
    renderer(),
  ],
  root: path.resolve(__dirname, 'src/renderer'),
  build: {
    outDir: path.resolve(__dirname, 'dist'),
  },
});
