# Deploying AITS Events to GoDaddy cPanel Hosting

## Prerequisites
- GoDaddy hosting account with cPanel access
- FTP client (FileZilla) or cPanel File Manager
- Node.js installed locally (for building JS files)

## Option 1: Direct Upload (Recommended for this project)

Since this is a static website with Firebase, you can upload files directly:

### Step 1: Build the JavaScript bundles

Run this command locally:
```bash
npm install
```

### Step 2: Upload Files to cPanel

1. **Login to GoDaddy cPanel**
   - Go to your GoDaddy account → My Products → Web Hosting → Manage
   - Click on cPanel Admin

2. **Open File Manager**
   - Navigate to `public_html` folder (or your domain's root folder)

3. **Upload ALL files and folders** (except these):
   - `node_modules/` (don't upload)
   - `.git/` (don't upload)
   - `package-lock.json` (optional)
   - `vite.config.js` (don't need on server)
   - `_original_reference/` (don't need on server)

4. **Required folders to upload:**
   ```
   ├── admin/
   ├── about-us/
   ├── book-a-booth-at-aits-2025/
   ├── contact/
   ├── event/
   ├── events/
   ├── feed/
   ├── js/
   ├── privacy-policy/
   ├── wp-content/
   ├── wp-includes/
   ├── wp-json/
   ├── index.html
   └── (other .html files in root)
   ```

### Step 3: Configure .htaccess for ES Modules

Create a `.htaccess` file in your `public_html` with:

```apache
# Enable CORS for Firebase
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
</IfModule>

# Set correct MIME type for JavaScript modules
<IfModule mod_mime.c>
    AddType application/javascript .js
    AddType text/javascript .mjs
</IfModule>

# Directory index
DirectoryIndex index.html

# Redirect /admin to /admin/index.html
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} -d
    RewriteCond %{REQUEST_FILENAME}/index.html -f
    RewriteRule ^(.*)$ $1/index.html [L]
</IfModule>

# Enable Gzip compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/css application/javascript application/json
</IfModule>

# Browser caching
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/gif "access plus 1 month"
    ExpiresByType image/webp "access plus 1 month"
    ExpiresByType text/css "access plus 1 week"
    ExpiresByType application/javascript "access plus 1 week"
</IfModule>
```

### Step 4: Update Firebase Configuration (if needed)

If your domain changes, update the authorized domains in Firebase Console:
1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Add your GoDaddy domain (e.g., `yourdomain.com`, `www.yourdomain.com`)

Also update Firestore rules if needed for your domain.

## Option 2: Using FTP (FileZilla)

1. **Get FTP credentials from GoDaddy:**
   - cPanel → FTP Accounts
   - Use the main account or create a new FTP user

2. **Connect with FileZilla:**
   - Host: ftp.yourdomain.com (or your server IP)
   - Username: your FTP username
   - Password: your FTP password
   - Port: 21

3. **Upload to `public_html`:**
   - Navigate to `/public_html` on remote
   - Upload all files (except node_modules, .git)

## Post-Deployment Checklist

- [ ] Test the homepage loads correctly
- [ ] Test admin login works (`/admin/`)
- [ ] Test event listing page (`/events/`)
- [ ] Test booth booking page
- [ ] Test contact form submission
- [ ] Verify Firebase data loads (check browser console for errors)
- [ ] Test on mobile devices

## Troubleshooting

### "Module not found" errors
- Ensure all `js/` folder files are uploaded
- Check that `.htaccess` is properly configured

### Firebase "permission denied" errors
- Check Firebase Console → Firestore → Rules
- Ensure your domain is in authorized domains

### Blank pages
- Check browser console for JavaScript errors
- Ensure `type="module"` scripts are loading correctly

### 404 errors on admin pages
- Ensure the `admin/` folder is fully uploaded
- Check `.htaccess` rewrite rules

## Important Notes

1. **SSL Certificate**: Ensure your GoDaddy hosting has SSL enabled (HTTPS). Firebase requires HTTPS for authentication.

2. **Domain Configuration**: If using a custom domain, update:
   - Firebase authorized domains
   - Any hardcoded URLs in the HTML files

3. **File Permissions**: Set folder permissions to 755 and file permissions to 644 in cPanel.

