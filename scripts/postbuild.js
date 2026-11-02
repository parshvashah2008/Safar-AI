import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const appDir = path.join(rootDir, '.next', 'server', 'app');
const nextDir = path.join(rootDir, '.next');
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(rootDir, 'public');

// Ensure fresh distDir
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// 1. Copy HTML files from .next/server/app to dist/ AND .next/
if (fs.existsSync(appDir)) {
  const files = fs.readdirSync(appDir);
  for (const file of files) {
    if (file.endsWith('.html')) {
      const src = path.join(appDir, file);
      let htmlContent = fs.readFileSync(src, 'utf8');
      const cacheMeta = '<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />\n<meta http-equiv="Pragma" content="no-cache" />\n<meta http-equiv="Expires" content="0" />';
      if (htmlContent.includes('<head>')) {
        htmlContent = htmlContent.replace('<head>', `<head>\n${cacheMeta}`);
      }

      fs.writeFileSync(path.join(nextDir, file), htmlContent, 'utf8');
      fs.writeFileSync(path.join(distDir, file), htmlContent, 'utf8');
      console.log(`Copied ${file} with cache-busting headers to dist/ and .next/`);

      // Also create folder/index.html for clean URLs (e.g. dist/plan/index.html)
      const baseName = path.basename(file, '.html');
      if (baseName !== 'index' && !baseName.startsWith('_')) {
        const subDir = path.join(distDir, baseName);
        if (!fs.existsSync(subDir)) {
          fs.mkdirSync(subDir, { recursive: true });
        }
        fs.writeFileSync(path.join(subDir, 'index.html'), htmlContent, 'utf8');
      }
    }
  }
}

// 2. Mirror static assets to dist/_next/static, .next/_next/static, and dist/static
const staticSrc = path.join(nextDir, 'static');
const distNextStatic = path.join(distDir, '_next', 'static');
const nextNextStatic = path.join(nextDir, '_next', 'static');
const distRootStatic = path.join(distDir, 'static');

if (fs.existsSync(staticSrc)) {
  fs.cpSync(staticSrc, distNextStatic, { recursive: true });
  fs.cpSync(staticSrc, nextNextStatic, { recursive: true });
  fs.cpSync(staticSrc, distRootStatic, { recursive: true });
  console.log('Mirrored static assets to dist/_next/static and dist/static');
}

// 3. Copy public files (favicon, images, etc.) to dist/
if (fs.existsSync(publicDir)) {
  fs.cpSync(publicDir, distDir, { recursive: true });
  console.log('Copied public/ assets to dist/');
}

// 4. Ensure _redirects exists in dist/
const redirectsSrc = path.join(publicDir, '_redirects');
if (fs.existsSync(redirectsSrc)) {
  fs.copyFileSync(redirectsSrc, path.join(distDir, '_redirects'));
  fs.copyFileSync(redirectsSrc, path.join(nextDir, '_redirects'));
  console.log('Copied _redirects to dist/');
}

// 5. GitHub Pages helpers: .nojekyll and 404.html fallback
fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
const indexHtmlSrc = path.join(distDir, 'index.html');
if (fs.existsSync(indexHtmlSrc)) {
  fs.copyFileSync(indexHtmlSrc, path.join(distDir, '404.html'));
  console.log('Created 404.html from index.html for client-side routing fallback');
}

console.log('Postbuild finished successfully. dist/ is ready for deployment.');
