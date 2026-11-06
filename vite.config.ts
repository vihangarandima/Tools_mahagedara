import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    port: 5180,
    strictPort: true,
    host: true,
    proxy: {
      '/api/thirdeye': {
        target: 'http://103.47.225.144/main_api/Api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/thirdeye/, '')
      }
    }
  }
});
