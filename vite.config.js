import { defineConfig } from 'vite';
import { resolve } from 'path';
import { existsSync } from 'node:fs';

export default defineConfig({
  server: {
    port: 8000,
    open: true,
    middlewareMode: false,
    fs: {
      strict: false
    }
  },
  publicDir: 'public',
  plugins: [
    {
      name: 'directory-index',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Handle directory requests
          if (req.url && req.url.endsWith('/') && !req.url.includes('.')) {
            const path = req.url.slice(1); // Remove leading slash
            const indexPath = resolve(__dirname, path, 'index.html');
            if (existsSync(indexPath)) {
              req.url = `/${path}index.html`;
            }
          }
          next();
        });
      }
    }
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        events: resolve(__dirname, 'events/index.html'),
        admin: resolve(__dirname, 'admin/index.html'),
        dashboard: resolve(__dirname, 'admin/dashboard.html'),
        eventsAdmin: resolve(__dirname, 'admin/events.html'),
        bookings: resolve(__dirname, 'admin/bookings.html'),
        eventDetail: resolve(__dirname, 'events/event-detail.html')
      }
    }
  },
  appType: 'mpa' // Multi-Page Application mode
});

