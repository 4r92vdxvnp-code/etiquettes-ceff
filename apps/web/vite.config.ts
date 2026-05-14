import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: process.env['VITE_BASE_URL'] ?? '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'CEFF Etiquetage',
        short_name: 'CEFF',
        description: 'Generateur d etiquettes pour tableaux electriques modulaires CEFF',
        theme_color: '#1F3864',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@ceff/core': path.resolve(__dirname, '../../packages/core/src/index.ts'),
      '@ceff/export-pdf': path.resolve(
        __dirname,
        '../../packages/export-pdf/src/index.ts'
      ),
    },
  },
});
