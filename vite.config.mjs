import { defineConfig } from 'vite';

export default defineConfig({
    root: 'public',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        minify: false,
        sourcemap: true
    },
    optimizeDeps: {
        include: ['canvaskit-wasm/bin/canvaskit.js']
    },
    server: {
        allowedHosts: ['vtjvlad.ddns.net'],
        port: 3000,
        strictPort: true,
        hmr: {
            host: 'vtjvlad.ddns.net'
        }
    }
});
