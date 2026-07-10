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
    host: '0.0.0.0',    // принимать подключения со всех интерфейсов
    https: true,       // использовать HTTPS
    hostname: [ 'vtjvlad.ddns.net', ], // имя хост
    proxy: {
      '/': {
        target: 'http://172.26.3.19:5173', // адрес вашего API
        changeOrigin: true,
        secure: false, // если ваш API использует самоподписанный сертификат
      }
    },
    port: 5173,          // порт для сервера разработки
    strictPort: true,   // не менять порт автоматически
    hmr: {
      protocol: 'wss',
      host: 'vtjvlad.ddns.net',
      port: 443 
    }
  },
               build: { /* ... */ }
});


