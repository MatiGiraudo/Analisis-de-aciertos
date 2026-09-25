/**
 * Configuración de Vite.
 *
 * - Plugin de React (JSX + Fast Refresh).
 * - Plugin de Tailwind v4 (motor CSS-first).
 * - Alias `@` → `src/` para imports absolutos y estables entre features (SCREAM).
 * - Bloque `test` de Vitest: entorno jsdom para poder testear dominio y componentes.
 */
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
  },
});
