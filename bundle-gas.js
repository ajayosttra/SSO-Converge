import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, 'dist');
const gasDir = path.resolve(__dirname, 'google-apps-script');

if (!fs.existsSync(distDir)) {
  console.error('Error: dist directory not found. Please run "npm run build" first.');
  process.exit(1);
}

if (!fs.existsSync(gasDir)) {
  fs.mkdirSync(gasDir, { recursive: true });
}

console.log('Building Google Apps Script standalone bundle...');

// 1. Read dist/index.html
let html = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

// 2. Find and inline CSS
const assetsDir = path.join(distDir, 'assets');
const assetFiles = fs.readdirSync(assetsDir);

const cssFiles = assetFiles.filter(f => f.endsWith('.css'));
let inlinedCss = '';
for (const cssFile of cssFiles) {
  const cssContent = fs.readFileSync(path.join(assetsDir, cssFile), 'utf-8');
  inlinedCss += cssContent + '\n';
}

// Replace <link rel="stylesheet" ...> with <style>...</style>
html = html.replace(/<link\s+rel="stylesheet"[^>]*href="\/assets\/[^"]*"[^>]*>/gi, '');
html = html.replace('</head>', `<style>\n${inlinedCss}\n</style>\n</head>`);

// 3. Find and inline JS
const jsFiles = assetFiles.filter(f => f.endsWith('.js'));
let inlinedJs = '';
for (const jsFile of jsFiles) {
  let jsContent = fs.readFileSync(path.join(assetsDir, jsFile), 'utf-8');
  // Escape closing script tags to avoid breaking the HTML parser
  jsContent = jsContent.replace(/<\/script>/gi, '<\\/script>');
  inlinedJs += jsContent + '\n';
}

// Replace <script type="module" ... src="/assets/..."> with inline script
html = html.replace(/<script\s+type="module"[^>]*src="\/assets\/[^"]*"[^>]*><\/script>/gi, '');
html = html.replace('</body>', `<script type="text/javascript">\n${inlinedJs}\n</script>\n</body>`);

// 4. Save to google-apps-script/Index.html
const gasIndexHtml = path.join(gasDir, 'Index.html');
fs.writeFileSync(gasIndexHtml, html, 'utf-8');
const sizeKb = (fs.statSync(gasIndexHtml).size / 1024).toFixed(1);
console.log(`✅ Generated: google-apps-script/Index.html (${sizeKb} KB)`);

// 5. Generate Code.gs
const codeGsContent = `/**
 * OSTTRA SSO Central - Google Apps Script Web App Entrypoint
 * 
 * Auto-generated bundle from the SSO Central React Codebase.
 */

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('OSTTRA SSO Central Portal')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Returns the active Google user's email if available within the Osttra workspace
 */
function getActiveUserEmail() {
  try {
    return Session.getActiveUser().getEmail() || 'user@osttra.com';
  } catch (err) {
    return 'user@osttra.com';
  }
}
`;
fs.writeFileSync(path.join(gasDir, 'Code.gs'), codeGsContent, 'utf-8');
console.log('✅ Generated: google-apps-script/Code.gs');

// 6. Generate appsscript.json
const appsscriptJson = {
  timeZone: 'Europe/London',
  dependencies: {},
  exceptionLogging: 'STACKDRIVER',
  runtimeVersion: 'V8',
  webapp: {
    executeAs: 'USER_DEPLOYING',
    access: 'ANYONE'
  }
};
fs.writeFileSync(path.join(gasDir, 'appsscript.json'), JSON.stringify(appsscriptJson, null, 2), 'utf-8');
console.log('✅ Generated: google-apps-script/appsscript.json');

console.log('\n🎉 Google Apps Script bundle successfully created in:');
console.log(gasDir);
