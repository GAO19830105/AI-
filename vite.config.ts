import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  /** 与 server/server.js 中 CORS 白名单一致（localhost / 127.0.0.1 的 5173、4173） */
  server: {
    port: 5173,
    strictPort: false,
    /** 启动开发服务器时在默认浏览器打开 http://localhost:5173/ */
    open: 'http://localhost:5173/',
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
