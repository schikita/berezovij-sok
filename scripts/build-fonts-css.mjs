import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function stripWoff(src) {
    return src.replace(/,\s*url\([^)]+\)\s*format\('woff'\)/g, '');
}

function extractBlocks(css) {
    const re = /\/\*[\s\S]*?@font-face\s*\{[\s\S]*?\}/g;
    return css.match(re) || [];
}

function keepInterBlock(block) {
    if (/greek|vietnamese/.test(block)) return false;
    if (/inter-cyrillic-ext-/.test(block)) return true;
    if (/inter-cyrillic-\d/.test(block) && !/inter-cyrillic-ext/.test(block)) return true;
    if (/inter-latin-ext-/.test(block)) return true;
    if (/inter-latin-\d/.test(block) && !/inter-latin-ext/.test(block)) return true;
    return false;
}

function keepPlayfairBlock(block) {
    if (/vietnamese/.test(block)) return false;
    return /playfair-display-(cyrillic|latin-ext|latin)-/.test(block);
}

let out = '/* Self-hosted: Inter + Playfair Display (latin, latin-ext, cyrillic) */\n\n';

for (const w of [300, 400, 500, 600, 700]) {
    const css = fs.readFileSync(path.join(root, 'node_modules/@fontsource/inter', `${w}.css`), 'utf8');
    for (const block of extractBlocks(css)) {
        if (!keepInterBlock(block)) continue;
        out += stripWoff(block) + '\n\n';
    }
}

for (const w of [400, 500, 600, 700]) {
    const css = fs.readFileSync(
        path.join(root, 'node_modules/@fontsource/playfair-display', `${w}.css`),
        'utf8'
    );
    for (const block of extractBlocks(css)) {
        if (!keepPlayfairBlock(block)) continue;
        out += stripWoff(block) + '\n\n';
    }
}

const outPath = path.join(root, 'vendor/fonts/fonts.css');
fs.writeFileSync(outPath, out.trim() + '\n');
console.log('Wrote', outPath, fs.statSync(outPath).size, 'bytes');
