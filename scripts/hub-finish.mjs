// Finish the hub build so the output is a CABINET, not just a static site.
//
// `vite build --config vite.hub.config.ts` gets the base path and the
// prerendered shell right. Three things it does not do, all of them rules the
// Suds-Jack arcade enforces on every cabinet (see DEPLOY_SPEC.md in that repo):
//
//   1. the HUB button — one import of the SITE's hub/shell.js, never a vendored
//      copy, because a vendored copy drifts
//   2. offline — a precache list that CANNOT be hand-kept, because vite hashes
//      its filenames; a list one name behind the page is an app that loads
//      online and is blank on a train
//   3. nothing leaves the browser — no analytics, no external calls, and no
//      fonts from a CDN. Every cabinet has to work on a plane, and several of
//      them say so in their own copy.
//
// So this runs after the build, over dist/client, and is purely additive.
import { readdir, readFile, writeFile, cp, access, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const DIST = 'dist/client';

async function walk(dir = '.', base = '') {
  const out = [];
  for (const e of await readdir(path.join(DIST, dir), { withFileTypes: true })) {
    const rel = path.join(base, e.name);
    if (e.isDirectory()) out.push(...await walk(path.join(dir, e.name), rel));
    else out.push('./' + rel.split(path.sep).join('/'));
  }
  return out;
}

const exists = async p => access(p).then(() => true, () => false);

// __grok/ is the PWA install onboarding — a manifest, an icon and a styled
// how-to-add-to-homescreen page with its own branding. __root.tsx already
// drops the two links to it under VITE_HUB_STATIC, so on the arcade it is
// 248 kB of another product's artwork that nothing references, and leaving it
// in dist means the precache walk below faithfully caches all of it.
await rm(path.join(DIST, '__grok'), { recursive: true, force: true });

// ── 1 + 3: the page ──
//
// The URLs here are absolute — `/Suds-Jack/kindling/…` — and they stay that
// way. Rewriting them relative was tried twice and cannot be made correct:
// `./` is right in the HTML and wrong inside a chunk (whose dynamic imports
// resolve against the MODULE url, giving assets/assets/…), `../` by depth is
// the reverse, and neither helps anyway because TanStack takes the router's
// BASEPATH from the same build-time base — served anywhere else the page
// renders "Not Found" with every asset loading fine. This build belongs at
// exactly one URL, and the arcade's gate now serves the tree at that URL,
// which is where GitHub Pages serves it too.
const html = path.join(DIST, 'index.html');
let page = await readFile(html, 'utf8');

// Rule 3 — no outbound requests — is enforced at the SOURCE, in __root.tsx,
// behind VITE_HUB_STATIC. It cannot be done here: React hoists a
// `precedence` stylesheet, so deleting the link from the prerendered HTML
// while the client still asks for it is a hydration mismatch, and the page
// comes up EMPTY rather than merely unstyled. This asserts the source did it.
if (/fonts\.(googleapis|gstatic)\.com/.test(page)) {
  throw new Error('hub build still links a webfont — gate it on hubStatic in __root.tsx');
}

// The HUB button goes in AFTER hydration, and that is not a nicety.
// __root.tsx renders <html> itself, so React owns the whole document: a button
// the shell appends to <body> before hydration is a child React did not render
// and it gets DELETED. It survived every test where the app failed to load,
// which is exactly the wrong way round. So the shell is imported on `load`,
// once hydration has run, and the hub's gate waits for the button rather than
// sampling for it at domcontentloaded.
if (!page.includes('hub-shell.js')) {
  page = page.replace('</body>', '<script type="module" src="./hub-shell.js"></script></body>');
}
await writeFile(html, page);

await writeFile(path.join(DIST, 'hub-shell.js'), `// The arcade's HUB button, and the service worker.
//
// hub/shell.js is the SITE's, loaded from the site root rather than vendored —
// a vendored copy drifts, and this one navigates on pointerup AND touchend
// because most cabinets preventDefault every touch and kill the synthesised
// click.
//
// It is imported on \`load\` rather than from a tag in the page because React
// owns the whole document in this app and removes any body child it did not
// render itself. Both calls are swallowed: a cabinet has to open with or
// without the arcade around it.
addEventListener('load', () => { import('../hub/shell.js').catch(() => {}); });
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
`);

// The release log travels WITH the build. The arcade derives every cabinet's
// number by reading that project's VERSIONS.md, so a build arriving without
// one has no honest source and the hub gate says so. Keeping the log at the
// source and copying it is what stops the number and the bytes disagreeing.
if (await exists('VERSIONS.md')) await cp('VERSIONS.md', path.join(DIST, 'VERSIONS.md'));

// ── 2: the worker ──
if (await exists('public/manifest.webmanifest') && !(await exists(path.join(DIST, 'manifest.webmanifest')))) {
  await cp('public/manifest.webmanifest', path.join(DIST, 'manifest.webmanifest'));
}

const files = [...new Set([...await walk(), './'])].sort();
const ver = createHash('sha256').update(files.join('\n')).digest('hex').slice(0, 8);
await writeFile(path.join(DIST, 'sw.js'), `// generated by scripts/hub-finish.mjs — do not edit
const CACHE = 'kindling-hub-${ver}';
const SHELL = ${JSON.stringify(files, null, 2)};
self.addEventListener('install', e => e.waitUntil((async () => {
  const c = await caches.open(CACHE);
  await Promise.all(SHELL.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {})));
  self.skipWaiting();
})()));
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const hit = await caches.match(req);
    if (hit) return hit;
    try { return await fetch(req); }
    catch {
      if (req.mode === 'navigate') {
        const shell = await caches.match('./index.html');
        if (shell) return shell;
      }
      throw new Error('offline and uncached');
    }
  })());
});
`);
console.log(`hub-finish: sw.js lists ${files.length} files, cache kindling-hub-${ver}`);
