/**
 * Bulk machine-translate data/site.json into data/i18n/<lang>.json
 *
 * Usage:
 *   node scripts/translate.cjs                 # all languages from site.json i18n.languages
 *   node scripts/translate.cjs --langs=es,ar   # only some
 *   node scripts/translate.cjs --force         # ignore existing translations
 *
 * Only human-facing strings are translated; icons, image paths, prices,
 * emails, phone numbers and config enums are skipped.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_FILE = path.join(ROOT, 'data', 'site.json');
const OUT_DIR = path.join(ROOT, 'data', 'i18n');

const args = process.argv.slice(2);
const argOf = (name) => {
    const hit = args.find((a) => a.startsWith('--' + name + '='));
    return hit ? hit.split('=').slice(1).join('=') : '';
};
const FORCE = args.includes('--force');

const SKIP_KEYS = new Set([
    'icon', 'image', 'href', 'url', 'email', 'phone', 'whatsapp', 'value', 'code', 'mark',
    'provider', 'frequency', 'retail', 'tsj', 'save', 'templateId', 'serviceId', 'publicKey',
    'accessKey', 'webhook', 'dir', 'label'
]);
const SKIP_PATHS = [/^i18n\./, /^leadSettings\.recipientEmail$/, /^contact\.(email|phone|whatsapp)$/];

function fnv(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
    }
    return ('0000000' + h.toString(16)).slice(-8);
}

function collect(node, keys, out) {
    if (Array.isArray(node)) {
        node.forEach((v, i) => collect(v, keys.concat(i), out));
        return;
    }
    if (node && typeof node === 'object') {
        Object.keys(node).forEach((k) => {
            if (SKIP_KEYS.has(k)) return;
            const p = keys.concat(k).join('.');
            if (SKIP_PATHS.some((re) => re.test(p))) return;
            collect(node[k], keys.concat(k), out);
        });
        return;
    }
    if (typeof node === 'string' && node.trim() && node.trim().length > 1) {
        out.push({ keys, text: node });
    }
}

function buildNested(entries) {
    const root = {};
    entries.forEach(({ keys, value }) => {
        let cur = root;
        keys.forEach((k, i) => {
            if (i === keys.length - 1) {
                cur[k] = value;
            } else {
                if (cur[k] === undefined) cur[k] = typeof keys[i + 1] === 'number' ? [] : {};
                cur = cur[k];
            }
        });
    });
    return root;
}

function getAt(obj, keys) {
    let cur = obj;
    for (const k of keys) {
        if (cur === null || cur === undefined) return undefined;
        cur = cur[k];
    }
    return cur;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Batch endpoint used by the Chrome dictionary extension: repeated q params,
   returns an array of translations in the same order. */
async function translateBatch(texts, tl) {
    const query = texts.map((t) => '&q=' + encodeURIComponent(t)).join('');
    const url = 'https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=en&tl=' +
        encodeURIComponent(tl) + query;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) throw new Error('batch ' + res.status);
    const data = await res.json();
    if (!Array.isArray(data) || data.length !== texts.length) {
        throw new Error('batch shape ' + (Array.isArray(data) ? data.length : typeof data));
    }
    return data.map((v) => String(Array.isArray(v) ? v[0] : v).trim());
}

async function translateOne(text, tl) {
    const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=' +
        encodeURIComponent(tl) + '&dt=t&q=' + encodeURIComponent(text);
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) throw new Error('single ' + res.status);
    const data = await res.json();
    if (!Array.isArray(data) || !Array.isArray(data[0])) throw new Error('single shape');
    return data[0].map((seg) => seg[0] || '').join('').trim();
}

async function translateMany(jobs, tl) {
    const size = 20;
    for (let i = 0; i < jobs.length; i += size) {
        const chunk = jobs.slice(i, i + size);
        let done = false;
        for (let attempt = 0; attempt < 3 && !done; attempt++) {
            try {
                const out = await translateBatch(chunk.map((j) => j.entry.text), tl);
                chunk.forEach((job, k) => { job.entry.value = out[k]; });
                done = true;
            } catch (e) {
                if (attempt === 2) {
                    console.warn('  ! batch failed (' + e.message + '), falling back one by one');
                    for (const job of chunk) {
                        try { job.entry.value = await translateOne(job.entry.text, tl); }
                        catch (err) { console.warn('  ! skipped:', job.entry.text.slice(0, 40)); }
                        await sleep(120);
                    }
                    done = true;
                } else {
                    await sleep(1500 * (attempt + 1));
                }
            }
        }
        console.log('  ... ' + Math.min(i + size, jobs.length) + '/' + jobs.length);
        await sleep(250);
    }
}

async function runPool(items, limit, worker) {
    let cursor = 0;
    let done = 0;
    const runners = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
        while (cursor < items.length) {
            const index = cursor++;
            const item = items[index];
            try {
                await worker(item, index);
            } catch (e) {
                console.warn('  ! failed:', (item.entry ? item.entry.text : '').slice(0, 40), '-', e.message);
            }
            done++;
            if (done % 25 === 0) console.log('  ... ' + done + '/' + items.length);
            await sleep(20);
        }
    });
    await Promise.all(runners);
}

async function main() {
    const site = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'));
    const source = (site.i18n && site.i18n.source) || 'en';
    const langs = (argOf('langs') ? argOf('langs').split(',') :
        ((site.i18n && site.i18n.languages) || []).map((l) => l.code))
        .filter((c) => c && c !== source);

    const entries = [];
    collect(site, [], entries);
    console.log('source strings:', entries.length, '| target languages:', langs.join(', '));

    fs.mkdirSync(OUT_DIR, { recursive: true });

    for (const lang of langs) {
        const file = path.join(OUT_DIR, lang + '.json');
        let prev = null;
        if (fs.existsSync(file)) {
            try { prev = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { prev = null; }
        }
        const prevAuto = (prev && prev._meta && prev._meta.auto) || {};

        const todo = [];
        entries.forEach((entry) => {
            const p = entry.keys.join('.');
            const existing = prev ? getAt(prev, entry.keys) : '';
            const hash = fnv(entry.text);
            if (!FORCE && typeof existing === 'string' && existing && prevAuto[p] === hash) {
                entry.value = existing;   // already translated from the same source text
            } else if (!FORCE && typeof existing === 'string' && existing && !prevAuto[p]) {
                entry.value = existing;   // human edited — keep
            } else {
                todo.push({ entry, hash });
            }
        });

        console.log('[' + lang + '] to translate:', todo.length);
        await translateMany(todo, lang);

        const auto = {};
        entries.forEach((entry) => {
            if (typeof entry.value === 'string' && entry.value) auto[entry.keys.join('.')] = fnv(entry.text);
        });

        const overlay = buildNested(entries.filter((e) => typeof e.value === 'string' && e.value));
        const out = Object.assign({ _meta: {
            lang,
            source,
            engine: 'google-gtx + mymemory fallback',
            generatedAt: new Date().toISOString(),
            note: 'Machine-translated first draft. Human review recommended for specs and certifications.',
            auto
        } }, overlay);

        fs.writeFileSync(file, JSON.stringify(out, null, 2) + '\n', 'utf8');
        console.log('[' + lang + '] written', path.relative(ROOT, file));
    }
}

main().catch((e) => { console.error(e); process.exit(1); });
