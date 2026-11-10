// Same tab icon (favicon) on every page
(function () {
    const FAVICON = 'favicon.png';
    for (const rel of ['icon', 'apple-touch-icon']) {
        let link = document.querySelector(`link[rel="${rel}"]`);
        if (!link) {
            link = document.createElement('link');
            link.rel = rel;
            document.head.appendChild(link);
        }
        link.href = FAVICON;
    }
})();

// =====================================================================
// shared.js: used by every page (with global.js) and by index.js
// =====================================================================
const STORAGE_KEY = '206words';
const CURRENT_PAGE = decodeURIComponent(location.pathname.split('/').pop()) || 'index.html';

// Bones drawn on more than one page. Each group = one real bone = one word.
// Format: 'shared name': [['Page.html', 'bone id on that page'], ...]
const SHARED_BONES = {
    // spine <-> pelvis
    'sacrum': [['Spine.html', 'sacrum'], ['Pelvis.html', 'sacrum']],
    'coccyx': [['Spine.html', 'coccyx'], ['Pelvis.html', 'coccyx']],

    // skull: single bones seen from several sides
    'frontal bone': [
        ['Facial_Bones_Front_View.html', 'frontal bone (1)'],
        ['Facial_Bones_Right_View.html', 'frontal bone (1)'],
        ['Facial_Bones_Left_View.html', 'frontal bone (1)']
    ],
    'sphenoid bone': [
        ['Facial_Bones_Front_View.html', 'sphenoid bone (1)'],
        ['Facial_Bones_Right_View.html', 'sphenoid bone (1)'],
        ['Facial_Bones_Left_View.html', 'sphenoid bone (1)']
    ],
    'ethmoid bone': [
        ['Facial_Bones_Front_View.html', 'ethmoid bone'],
        ['Facial_Bones_Right_View.html', 'ethmoid bone (1)'],
        ['Facial_Bones_Left_View.html', 'ethmoid bone (1)']
    ],
    'mandible': [
        ['Facial_Bones_Front_View.html', 'mandible (1)'],
        ['Facial_Bones_Right_View.html', 'mandible (1)'],
        ['Facial_Bones_Left_View.html', 'mandible (1)']
    ],
    'occipital bone': [
        ['Facial_Bones_Right_View.html', 'occipital bone (1)'],
        ['Facial_Bones_Left_View.html', 'occipital bone (1)']
    ],
        // paired bones: each side view shows that side's bone from the front view
    'left lacrimal bone': [
        ['Facial_Bones_Front_View.html', 'lacrimanal bones - left'],
        ['Facial_Bones_Left_View.html', 'lacrimal bone (2)']
    ],
    'right lacrimal bone': [
        ['Facial_Bones_Front_View.html', 'lacrimanal bones - right'],
        ['Facial_Bones_Right_View.html', 'lacrimal bone (2)']
    ],
    'left maxilla': [
        ['Facial_Bones_Front_View.html', 'maxilla - left'],
        ['Facial_Bones_Left_View.html', 'maxilla (2)']
    ],
    'right maxilla': [
        ['Facial_Bones_Front_View.html', 'maxilla - right'],
        ['Facial_Bones_Right_View.html', 'maxilla (2)']
    ],
    'left nasal bone': [
        ['Facial_Bones_Front_View.html', 'nasal bones - left'],
        ['Facial_Bones_Left_View.html', 'nasal bone (2)']
    ],
    'right nasal bone': [
        ['Facial_Bones_Front_View.html', 'nasal bones - right'],
        ['Facial_Bones_Right_View.html', 'nasal bone (2)']
    ],
    'left parietal bone': [
        ['Facial_Bones_Front_View.html', 'parietal bones - left'],
        ['Facial_Bones_Left_View.html', 'parietal bone (2)']
    ],
    'right parietal bone': [
        ['Facial_Bones_Front_View.html', 'parietal bones - right'],
        ['Facial_Bones_Right_View.html', 'parietal bone (2)']
    ],
    'left temporal bone': [
        ['Facial_Bones_Front_View.html', 'temporal bones - left'],
        ['Facial_Bones_Left_View.html', 'temporal bone (2)']
    ],
    'right temporal bone': [
        ['Facial_Bones_Front_View.html', 'temporal bones - right'],
        ['Facial_Bones_Right_View.html', 'temporal bone (2)']
    ],
    'left zygomatic bone': [
        ['Facial_Bones_Front_View.html', 'zygomatic bones - left'],
        ['Facial_Bones_Left_View.html', 'zygomatic bone (2)']
    ],
    'right zygomatic bone': [
        ['Facial_Bones_Front_View.html', 'zygomatic bones - right'],
        ['Facial_Bones_Right_View.html', 'zygomatic bone (2)']
    ],
};

// 'Page.html#bone id' -> shared name
const SHARED_LOOKUP = {};
for (const [name, places] of Object.entries(SHARED_BONES)) {
    for (const [page, id] of places) SHARED_LOOKUP[page + '#' + id] = name;
}

// the key a bone is saved under
function boneKey(page, id) {
    return SHARED_LOOKUP[page + '#' + id] || page + '#' + id;
}

function readStore() {
    let store = null;
    try {
        store = JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch (error) { }
    if (store && store.bones) return splitOldCartilage(store);

    // first run: move words saved by the earlier version ("206words:Page.html") into the new format
    store = { bones: {} };
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key || !key.startsWith(STORAGE_KEY + ':')) continue;
            const page = key.slice(STORAGE_KEY.length + 1);
            const old = JSON.parse(localStorage.getItem(key)) || {};
            for (const [id, saved] of Object.entries(old.words || {})) {
                const k = boneKey(page, id);
                store.bones[k] = { ...(store.bones[k] || {}), ...saved, page };
            }
            for (const [id, paint] of Object.entries(old.paint || {})) {
                const k = boneKey(page, id);
                store.bones[k] = { ...(store.bones[k] || {}), paint };
            }
        }
    } catch (error) { }
    return splitOldCartilage(store);
}

// costal cartilage used to be one shape per level (rib.html#CC-1); each side is now its own shape
function splitOldCartilage(store) {
    for (let n = 1; n <= 6; n++) {
        const oldKey = 'rib.html#CC-' + n;
        const old = store.bones[oldKey];
        if (!old) continue;
        for (const side of ['right', 'left']) {
            const key = `rib.html#CC-${n}-${side}`;
            const entry = store.bones[key] || {};
            if (old.paint && !entry.paint) entry.paint = old.paint;
            if (side === 'right' && old.word && !entry.word) Object.assign(entry, old, { paint: entry.paint });
            if (Object.keys(entry).length) store.bones[key] = entry;
        }
        delete store.bones[oldKey];
    }
    return store;
}

function writeStore(store) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (error) {
        console.warn('Could not save:', error);
    }
}

// read an inline style string ("font-size: 12px; font-weight: bold") into a style object
function parseStyle(text) {
    const style = document.createElement('span').style;
    style.cssText = text || '';
    return style;
}

// Copy a saved word onto another drawing of the same bone.
// `box` = bounding box of the bone in the new drawing.
// Same spot inside the bone, same angle, size scaled to the bone.
function mapWord(entry, box) {
    if (!entry || !entry.box || !entry.rel || !entry.box.w || !box || !box.width) return null;
    const style = parseStyle(entry.style);
    const savedSize = parseFloat(style.fontSize);
    if (!savedSize) return null;

    const scale = Math.hypot(box.width, box.height) / Math.hypot(entry.box.w, entry.box.h);
    const data = entry.data || {};
    return {
        x: box.x + entry.rel.u * box.width,
        y: box.y + entry.rel.v * box.height,
        angle: (parseFloat(data.angle) || 0) + (parseFloat(data.tilt) || 0),
        size: savedSize * scale,
        spacing: (parseFloat(style.letterSpacing) || 0) * scale,
        style
    };
}

// =====================================================================
// downloads: embed the Dashtseden font so images look exactly like the screen
// =====================================================================
const FONT_FILES = [
    ['fonts/Dashtseden.ttf', 'truetype']
];
let fontCssCache = null;

// the font file as text that can live inside an SVG (read once, then reused)
function embeddedFontCss() {
    if (!fontCssCache) {
        fontCssCache = (async () => {
            for (const [url, format] of FONT_FILES) {
                try {
                    const response = await fetch(url);
                    if (!response.ok) continue;
                    const blob = await response.blob();
                    const data = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });
                    return `@font-face { font-family: "Dashtseden"; src: url(${data}) format("${format}"); ` +
                        `unicode-range: U+1800-18AF, U+11660-1167F, U+202F; }`;
                } catch (error) { }
            }
            console.warn('Dashtseden font file not found in /fonts: downloads will use a fallback font');
            return '';
        })();
    }
    return fontCssCache;
}

function saveFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// clone = a finished copy of the SVG (size, background, everything set)
// format = 'svg' | 'png' | 'jpg'
async function exportSvg(clone, format, name) {
    const css = await embeddedFontCss();
    if (css) {
        const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
        style.textContent = css;
        clone.insertBefore(style, clone.firstChild);
    }

    const markup = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' });
    if (format === 'svg') {
        saveFile(svgBlob, name + '.svg');
        return;
    }

    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.src = url;
    try {
        await img.decode();
    } catch (error) {
        await new Promise(resolve => { img.onload = resolve; });
    }
    await new Promise(resolve => setTimeout(resolve, 100));   // let the embedded font finish rendering

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext('2d').drawImage(img, 0, 0);
    URL.revokeObjectURL(url);

    const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
    canvas.toBlob(blob => saveFile(blob, name + '.' + format), mime, 0.92);
}

// =====================================================================
// footer on every page
// =====================================================================
const FOOTER_TEXT = 'I am made up of 206 words';

(function addFooter() {
    const container = document.querySelector('.container');
    if (!container || container.querySelector('.site-footer')) return;
    const footer = document.createElement('p');
    footer.className = 'site-footer';
    footer.textContent = FOOTER_TEXT;
    container.append(footer);
})();

// =====================================================================
// download poster: 4:5, title on top, drawing in the middle, footer at the bottom
// =====================================================================
const POSTER_W = 1000;
const POSTER_H = 1250;           // 4:5
const POSTER_SCALE = 4;          // PNG/JPG are 4000 x 5000 pixels

// art = a copy of the drawing's <svg> (with its viewBox), title = text for the top
function makePoster(art, title, background, scale) {
    const NS = 'http://www.w3.org/2000/svg';
    const poster = document.createElementNS(NS, 'svg');
    poster.setAttribute('xmlns', NS);
    poster.setAttribute('viewBox', `0 0 ${POSTER_W} ${POSTER_H}`);
    poster.setAttribute('width', POSTER_W * scale);
    poster.setAttribute('height', POSTER_H * scale);

    if (background) {
        const rect = document.createElementNS(NS, 'rect');
        rect.setAttribute('width', POSTER_W);
        rect.setAttribute('height', POSTER_H);
        rect.setAttribute('fill', background);
        poster.append(rect);
    }

    const header = document.querySelector('.page-header p');
    const footerEl = document.querySelector('.site-footer');
    const titleFont = getComputedStyle(header || document.body).fontFamily;
    const footerFont = getComputedStyle(footerEl || document.body).fontFamily;

    function addText(text, y, size, font) {
        const t = document.createElementNS(NS, 'text');
        t.setAttribute('x', POSTER_W / 2);
        t.setAttribute('y', y);
        t.setAttribute('text-anchor', 'middle');
        t.setAttribute('dominant-baseline', 'middle');
        t.setAttribute('font-size', size);
        t.setAttribute('font-family', font);
        t.setAttribute('fill', '#000');
        t.setAttribute('letter-spacing', size * 0.04);
        t.textContent = text;
        poster.append(t);
    }

    if (title) addText(title, 110, 44, titleFont);

    // the drawing, scaled to fit between title and footer, centred, never stretched
    const margin = 90;
    const top = 190;
    const bottom = POSTER_H - 160;
    art.setAttribute('x', margin);
    art.setAttribute('y', top);
    art.setAttribute('width', POSTER_W - 2 * margin);
    art.setAttribute('height', bottom - top);
    art.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    poster.append(art);

    addText(FOOTER_TEXT, POSTER_H - 80, 30, footerFont);
    return poster;
}

// "Happy writing" notice after downloads
(function () {
    const notice = document.createElement('dialog');
    notice.id = 'safetyNotice';
    notice.innerHTML = `
        <p>Hi, happy writing.</p>
        <p>If you are going to share your words on social media, make sure to hide any sensitive information.</p>
        <p>Be safe, have fun :))</p>
        <button type="button">OK</button>
    `;
    document.body.appendChild(notice);

    notice.querySelector('button').addEventListener('click', () => notice.close());

    // Close when clicking outside the box
    notice.addEventListener('click', (e) => {
        if (e.target === notice) notice.close();
    });

    // Show it after a real download choice
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('#downloadDialog button[data-format]');
        if (!btn || btn.dataset.format === 'cancel') return;

        // Small delay so the download dialog closes first
        setTimeout(() => notice.showModal(), 300);
    });
})();

// Clickable word list from the counter
(function () {
    const countEl = document.getElementById('count');
    if (!countEl) return;

    const prettify = (s) => s.replace(/\.html$/i, '').replace(/_/g, ' ');

    function getEntries() {
        let saved;
        try {
            saved = JSON.parse(localStorage.getItem('206words')) || {};
        } catch {
            return [];
        }
        const bones = saved.bones || {};

        return Object.entries(bones)
            .filter(([, v]) => v.word && v.word.trim())   // skip paint-only entries
            .map(([key, v]) => {
                const page = v.page || key.split('#')[0];
                const bone = (v.data && v.data.bone) || key.split('#')[1] || '';
                return { page, bone, word: v.word.trim(), hidden: v.hidden };
            });
    }

    // Build the dialog
    const dialog = document.createElement('dialog');
    dialog.id = 'wordList';
    document.body.appendChild(dialog);

    function render() {
        const entries = getEntries();

        if (!entries.length) {
            dialog.innerHTML = `
                <p>No words written yet.</p>
                <button type="button" class="close">Close</button>`;
        } else {
            // Group by page
            const groups = {};
            entries.forEach(e => (groups[e.page] ||= []).push(e));

            const sections = Object.entries(groups).map(([page, items]) => `
                <section>
                    <h3><a href="${page}">${prettify(page)}</a></h3>
                    <ul>
                        ${items.map(e => `
                            <li>
                                <span class="bone">${prettify(e.bone)}</span>
                                <span class="word">${e.hidden ? e.word[0] + '…' : escapeHTML(e.word)}</span>
                            </li>`).join('')}
                    </ul>
                </section>`).join('');

            dialog.innerHTML = `
                <p class="list-title">${entries.length} of 206 words</p>
                ${sections}
                <button type="button" class="close">Close</button>`;
        }

        dialog.querySelector('.close').addEventListener('click', () => dialog.close());
    }

    function escapeHTML(s) {
        return s.replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    countEl.style.cursor = 'pointer';
    countEl.title = 'See your words';
    countEl.addEventListener('click', () => {
        render();
        dialog.showModal();
    });

    // Click outside to close
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) dialog.close();
    });
})();

// Info mode: show bone names on hover
(function () {
    const stage = document.querySelector('.stage svg');
    const header = document.querySelector('.page-header');
    if (!stage || !header) return;

    const NOT_BONES = /disc|vector|cartilage|^cc-|teeth/i;

    function clean(name) {
        return name
            .replace(/_\d+$/, '')
            .replace(/\s*\(\d+\)/, '')
            .replace(/_/g, ' ')
            .trim()
            .replace(/^./, c => c.toUpperCase());
    }

    function labelFor(path) {
        const bone = clean(path.id);
        const group = path.parentElement.closest('g[id]');
        const groupName = group ? clean(group.id) : '';
        const useGroup = groupName && !/^(left|right)_?/i.test(group.id) && groupName !== bone;
        return useGroup ? `${groupName} · ${bone}` : bone;
    }

    // Info button
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'info-btn';
    btn.textContent = 'i';
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', 'Show bone names');
    btn.dataset.tip = "Show labels";

    // Put it right after Undo (or Hide if there's no Undo)
    const anchor = document.querySelector('.undo-btn') || document.querySelector('.hide-btn');
    if (anchor) {
        anchor.insertAdjacentElement('afterend', btn);
    } else {
        header.appendChild(btn);
    }

    // Line it up just to the right of Undo
    function placeInfoBtn() {
        if (!anchor) return;
        btn.style.position = 'absolute';
        btn.style.bottom = (anchor.offsetHeight - btn.offsetHeight) / 2 + 'px';
        btn.style.left = (anchor.offsetLeft + anchor.offsetWidth + 10) + 'px';
    }

    placeInfoBtn();
    // Re-place it whenever Undo or the ⓘ changes size (font loading, zoom, resizing the window)
    if (anchor) {
        const observer = new ResizeObserver(placeInfoBtn);
        observer.observe(anchor);
        observer.observe(btn);
    }
    window.addEventListener('resize', placeInfoBtn); // re-measure once fonts load

    // Tooltip that follows the cursor
    const tip = document.createElement('div');
    tip.className = 'bone-tip';
    tip.hidden = true;
    document.body.appendChild(tip);

    let infoMode = false;

    btn.addEventListener('click', () => {
        infoMode = !infoMode;
        btn.classList.toggle('active', infoMode);
        btn.setAttribute('aria-pressed', String(infoMode));
        document.body.classList.toggle('info-mode', infoMode);
        if (!infoMode) tip.hidden = true;
    });

    stage.addEventListener('pointermove', (e) => {
        if (!infoMode) return;
        const path = e.target.closest('path[id]');
        if (!path || NOT_BONES.test(path.id)) { tip.hidden = true; return; }
        tip.textContent = labelFor(path);
        tip.hidden = false;
        tip.style.left = `${e.clientX + 12}px`;
        tip.style.top = `${e.clientY + 12}px`;
    });

    stage.addEventListener('pointerleave', () => { tip.hidden = true; });

    stage.addEventListener('pointerdown', (e) => {
        if (infoMode && e.pointerType !== 'mouse') {
            setTimeout(() => { tip.hidden = true; }, 1500);
        }
    });
})();
