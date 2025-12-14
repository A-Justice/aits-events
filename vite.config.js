import { defineConfig } from 'vite';
import { resolve } from 'path';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Function to find all HTML files recursively
function findHtmlFiles(dir, basePath = '') {
  const entries = {};
  const items = readdirSync(dir);
  
  for (const item of items) {
    const fullPath = resolve(dir, item);
    const relativePath = basePath ? `${basePath}/${item}` : item;
    
    // Skip node_modules, dist, and hidden directories
    if (item === 'node_modules' || item === 'dist' || item.startsWith('.') || item === '_original_reference') {
      continue;
    }
    
    if (statSync(fullPath).isDirectory()) {
      Object.assign(entries, findHtmlFiles(fullPath, relativePath));
    } else if (item.endsWith('.html')) {
      const name = relativePath.replace(/\//g, '_').replace('.html', '');
      entries[name] = fullPath;
    }
  }
  
  return entries;
}

const htmlInputs = findHtmlFiles(__dirname);

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
      input: htmlInputs
    },
    // Copy all assets
    copyPublicDir: true,
    // Ensure assets are in a predictable location
    assetsDir: 'assets'
  },
  appType: 'mpa' // Multi-Page Application mode
});
