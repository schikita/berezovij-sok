const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'index.html');
const ph =
    'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
let html = fs.readFileSync(file, 'utf8');
const heroIdx = html.indexOf('id="hero"');
if (heroIdx < 0) throw new Error('hero');
const heroClose = html.indexOf('</section>', heroIdx);
if (heroClose < 0) throw new Error('hero close');
const cut = heroClose + '</section>'.length;
const before = html.slice(0, cut);
let after = html.slice(cut);

after = after.replace(
    /<img(\s+)([^>]*?)(?<!-)src="([^"]+)"([^>]*?)>/gi,
    (m, sp, pre, src, post) => {
        if (src.startsWith('data:')) return m;
        if (pre.includes('data-defer-src') || post.includes('data-defer-src')) return m;
        let cleanPre = pre
            .replace(/\sloading="lazy"\s?/gi, ' ')
            .replace(/\sloading='lazy'\s?/gi, ' ');
        let cleanPost = post
            .replace(/\sloading="lazy"\s?/gi, ' ')
            .replace(/\sloading='lazy'\s?/gi, ' ');
        const p = cleanPre.trim();
        return `<img${sp}${p ? `${p} ` : ''}src="${ph}" data-defer-src="${src}"${cleanPost}>`;
    }
);

fs.writeFileSync(file, before + after);
console.log('defer-images-html: ok');
