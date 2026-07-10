import { defineConfig } from 'vite';

export default defineConfig({
    root: 'public',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        minify: false,
        sourcemap: true
    },


server: { 
    allowedHosts: ['vtjvlad.ddns.net'], // разрешенные хосты websocket
   // https: true,       // использовать HTTPS
    port: 3000,          // порт для сервера разработки
    strictPort: true,   // не менять порт автоматически
    hmr: {
      host: 'vtjvlad.ddns.net',
    }
  },
               build: { /* ... */ }
});


