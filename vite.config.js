import { defineConfig } from 'vite';
import { resolve } from 'path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  server: {
    port: 8000,
    open: true,
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
          if (req.url) {
            const urlPath = req.url.split('?')[0].split('#')[0];
            const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
            
            // Handle /admin (no trailing slash) - most common case
            if (urlPath === '/admin') {
              req.url = '/admin/index.html' + queryString;
            }
            // Handle /admin/ (with trailing slash)
            else if (urlPath === '/admin/') {
              req.url = '/admin/index.html' + queryString;
            }
            // Handle other directories ending with /
            else if (urlPath.endsWith('/') && !urlPath.includes('.')) {
              const dirPath = urlPath.slice(1, -1); // Remove leading and trailing slashes
              const indexPath = resolve(__dirname, dirPath, 'index.html');
              if (existsSync(indexPath)) {
                req.url = `/${dirPath}/index.html` + queryString;
              }
            }
            // Handle directories without trailing slash
            else if (!urlPath.includes('.') && !urlPath.endsWith('/') && urlPath !== '/') {
              const indexPath = resolve(__dirname, urlPath.slice(1), 'index.html');
              if (existsSync(indexPath)) {
                req.url = urlPath + '/index.html' + queryString;
              }
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

