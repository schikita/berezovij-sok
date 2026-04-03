import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function ensureDir(d) {
    fs.mkdirSync(d, { recursive: true });
}

function copyDir(src, dest) {
    ensureDir(dest);
    for (const name of fs.readdirSync(src)) {
        const from = path.join(src, name);
        const to = path.join(dest, name);
        if (fs.statSync(from).isDirectory()) copyDir(from, to);
        else fs.copyFileSync(from, to);
    }
}

ensureDir(path.join(root, 'vendor/gsap'));
fs.copyFileSync(path.join(root, 'node_modules/gsap/dist/gsap.min.js'), path.join(root, 'vendor/gsap/gsap.min.js'));
fs.copyFileSync(
    path.join(root, 'node_modules/gsap/dist/ScrollTrigger.min.js'),
    path.join(root, 'vendor/gsap/ScrollTrigger.min.js')
);

ensureDir(path.join(root, 'vendor/swiper'));
fs.copyFileSync(path.join(root, 'node_modules/swiper/swiper-bundle.min.js'), path.join(root, 'vendor/swiper/swiper-bundle.min.js'));
fs.copyFileSync(path.join(root, 'node_modules/swiper/swiper-bundle.min.css'), path.join(root, 'vendor/swiper/swiper-bundle.min.css'));

ensureDir(path.join(root, 'vendor/fontawesome/css'));
ensureDir(path.join(root, 'vendor/fontawesome/webfonts'));
fs.copyFileSync(
    path.join(root, 'node_modules/@fortawesome/fontawesome-free/css/all.min.css'),
    path.join(root, 'vendor/fontawesome/css/all.min.css')
);
copyDir(path.join(root, 'node_modules/@fortawesome/fontawesome-free/webfonts'), path.join(root, 'vendor/fontawesome/webfonts'));

ensureDir(path.join(root, 'vendor/leaflet/images'));
fs.copyFileSync(path.join(root, 'node_modules/leaflet/dist/leaflet.css'), path.join(root, 'vendor/leaflet/leaflet.css'));
fs.copyFileSync(path.join(root, 'node_modules/leaflet/dist/leaflet.js'), path.join(root, 'vendor/leaflet/leaflet.js'));
copyDir(path.join(root, 'node_modules/leaflet/dist/images'), path.join(root, 'vendor/leaflet/images'));

ensureDir(path.join(root, 'vendor/fonts/files'));
const interW = [300, 400, 500, 600, 700];
const interDir = path.join(root, 'node_modules/@fontsource/inter/files');
for (const w of interW) {
    for (const f of [
        `inter-latin-${w}-normal.woff2`,
        `inter-latin-ext-${w}-normal.woff2`,
        `inter-cyrillic-${w}-normal.woff2`,
        `inter-cyrillic-ext-${w}-normal.woff2`,
    ]) {
        fs.copyFileSync(path.join(interDir, f), path.join(root, 'vendor/fonts/files', f));
    }
}
const playfairW = [400, 500, 600, 700];
const pfDir = path.join(root, 'node_modules/@fontsource/playfair-display/files');
for (const w of playfairW) {
    for (const f of [
        `playfair-display-latin-${w}-normal.woff2`,
        `playfair-display-latin-ext-${w}-normal.woff2`,
        `playfair-display-cyrillic-${w}-normal.woff2`,
    ]) {
        fs.copyFileSync(path.join(pfDir, f), path.join(root, 'vendor/fonts/files', f));
    }
}

const r = spawnSync(process.execPath, [path.join(root, 'scripts/build-fonts-css.mjs')], {
    cwd: root,
    stdio: 'inherit',
});
if (r.status !== 0) process.exit(r.status ?? 1);
console.log('vendor sync done');
