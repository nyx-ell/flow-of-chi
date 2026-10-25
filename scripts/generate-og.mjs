// Generates the social sharing image and icons for Flow of Chi.
//
//   npm i -D playwright && npx playwright install chromium
//   node scripts/generate-og.mjs
//
// Writes og-image.png (1200×630), favicon.svg and apple-touch-icon.png (180×180)
// to the repo root. The OG image uses a live capture of the floor plan from
// index.html, plus the page's own palette, typefaces and ensō, so it stays in
// sync with the site. Needs a network connection for Google Fonts.

import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const indexPath = path.join(root, 'index.html');
const html = await readFile(indexPath, 'utf8');

// Reuse the exact font stylesheets and ensō logo from the page.
const fontLinks = [...html.matchAll(/href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)"/g)]
  .map(([, href]) => `<link href="${href}" rel="stylesheet">`).join('\n');
const enso = html.match(/<svg class="logo"[\s\S]*?<\/svg>/)[0].replace('class="logo"', 'class="enso"');

const P = { paper: '#E8ECE5', panel: '#F3F5F0', ink: '#1E2A30', inkSoft: '#56646A', line: '#C6CEC4', cinnabar: '#B5372A' };
const ELEMENTS = [['木', 'Wood', '#4E8B5B'], ['火', 'Fire', '#C0392B'], ['土', 'Earth', '#C9A227'], ['金', 'Metal', '#9AA3A8'], ['水', 'Water', '#2E5E7E']];

const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="${P.paper}"/>
  <path d="M28.5 10.5a18 18 0 1 1-.1 0" fill="none" stroke="${P.ink}" stroke-width="6.5" stroke-linecap="round"/>
  <path d="M16.5 18.5a15 15 0 0 1 8-5.5" fill="none" stroke="${P.ink}" stroke-width="2.2" stroke-linecap="round" opacity=".45"/>
  <rect x="47" y="47" width="10" height="10" rx="1.5" fill="${P.cinnabar}" transform="rotate(-4 52 52)"/>
</svg>
`;

const paperNoise = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.45 0 0 0 0 0.40 0 0 0 0 0.32 0 0 0 .07 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

const browser = await chromium.launch();

// 1. Capture the floor plan once the chi has had time to settle into the rooms.
const app = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2, colorScheme: 'light', reducedMotion: 'no-preference' });
await app.goto(pathToFileURL(indexPath).href);
await app.evaluate(() => document.fonts.ready);
await app.waitForTimeout(14000);
const planPng = await app.locator('#plan').screenshot();
await app.close();

// 2. Compose the 1200×630 card.
const card = `<!doctype html><html><head><meta charset="utf-8">
${fontLinks}
<style>
  *{box-sizing:border-box;margin:0}
  body{width:1200px;height:630px;overflow:hidden;background:${P.paper} ${paperNoise};color:${P.ink};font-family:"IBM Plex Sans",system-ui,sans-serif;display:grid;grid-template-columns:470px 1fr;align-items:center;gap:36px;padding:0 56px 0 64px}
  .enso{width:96px;height:96px;color:${P.ink};opacity:.9}
  .brand{display:flex;align-items:flex-start;gap:14px;margin:22px 0 0}
  h1{font-family:Spectral,Georgia,serif;font-weight:400;font-size:80px;line-height:.95;letter-spacing:-.015em}
  .seal{font-family:"Noto Serif SC","Noto Serif CJK SC",serif;font-weight:600;font-size:30px;line-height:1;color:#FBF6EC;background:${P.cinnabar};padding:9px 8px 10px;border-radius:4px;transform:rotate(-3deg);margin-top:8px;box-shadow:inset 0 0 0 2px rgba(251,246,236,.35)}
  .kicker{font-family:Spectral,Georgia,serif;font-style:italic;font-size:30px;color:${P.inkSoft};margin-top:14px}
  .lede{font-size:21px;line-height:1.45;color:${P.inkSoft};margin-top:22px;max-width:410px}
  .els{display:flex;gap:18px;margin-top:30px;font-size:17px;color:${P.inkSoft}}
  .els span{display:inline-flex;align-items:center;gap:6px}
  .els b{font-family:"Noto Serif SC","Noto Serif CJK SC",serif;font-size:22px;font-weight:600}
  .url{margin-top:30px;font-size:17px;letter-spacing:.02em;color:${P.ink};border-top:1.5px solid ${P.line};padding-top:14px;display:inline-block}
  .frame{padding:12px;background:${P.panel};border:1px solid ${P.line};border-radius:8px;box-shadow:inset 0 0 0 5px ${P.paper},inset 0 0 0 6px ${P.line},0 22px 40px -24px rgba(40,30,20,.45)}
  .frame img{display:block;width:100%;border-radius:3px}
</style></head><body>
  <div>
    ${enso}
    <div class="brand"><h1>Flow of Chi</h1><span class="seal">氣</span></div>
    <p class="kicker">Feng shui for your floor plan</p>
    <p class="lede">See how chi moves through a home, and how the layout makes it feel.</p>
    <div class="els">${ELEMENTS.map(([ch, name, col]) => `<span><b style="color:${col}">${ch}</b>${name}</span>`).join('')}</div>
    <p class="url">flowofchi.nicolelin.com</p>
  </div>
  <div class="frame"><img src="data:image/png;base64,${planPng.toString('base64')}" alt=""></div>
</body></html>`;

const og = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await og.setContent(card, { waitUntil: 'networkidle' });
await og.evaluate(() => document.fonts.ready);
await writeFile(path.join(root, 'og-image.png'), await og.screenshot({ type: 'png' }));

// 3. Icons.
await writeFile(path.join(root, 'favicon.svg'), FAVICON);
const icon = await browser.newPage({ viewport: { width: 180, height: 180 } });
await icon.setContent(`<style>*{margin:0}body{width:180px;height:180px;background:${P.paper}}svg{width:180px;height:180px;display:block}</style>${FAVICON.replace(/rx="14"/, 'rx="0"')}`);
await writeFile(path.join(root, 'apple-touch-icon.png'), await icon.screenshot({ type: 'png' }));

await browser.close();
console.log('Wrote og-image.png, favicon.svg and apple-touch-icon.png');
