// =====================================================================
// 1. MODES: working (click regions) / presenting (toggles, no clicks)
// =====================================================================
const REGION_PAGES = {
    Skull: 'Skull.html',
    shoulder: 'Shoulder.html',
    Rib: 'rib.html',
    Spine: 'Spine.html',
    Pelvis: 'Pelvis.html',
    Right_Arm: 'Right_Arm.html',
    Left_Arm: 'Left_Arm.html',
    Right_Hand: 'Right_Hand.html',
    Left_Hand: 'Left_Hand.html',
    Right_Leg: 'Right_Leg.html',
    Left_Leg: 'Left_Leg.html',
    Right_Foot: 'Right_Foot.html',
    Left_Foot: 'Left_Foot.html'
};

const skeleton = document.querySelector('.stage svg');
const modeBtn = document.querySelector('.mode-btn');
const wordsBtn = document.querySelector('.words-btn');
const outlineBtn = document.querySelector('.outline-btn');
let presenting = false;

function setPresenting(on) {
    presenting = on;
    if (modeBtn) {
        modeBtn.textContent = on ? 'Work' : 'Present';
        modeBtn.classList.toggle('active', on);
    }
    if (wordsBtn) wordsBtn.hidden = !on;
    if (outlineBtn) outlineBtn.hidden = !on;
    skeleton.style.cursor = 'default';
    if (!on) {                                   // back to working: show everything again
        skeleton.classList.remove('no-words', 'no-outline');
        if (wordsBtn) { wordsBtn.textContent = 'Hide words'; wordsBtn.classList.remove('active'); }
        if (outlineBtn) { outlineBtn.textContent = 'Hide outlines'; outlineBtn.classList.remove('active'); }
    }
}

if (modeBtn) modeBtn.addEventListener('click', () => setPresenting(!presenting));

if (wordsBtn) wordsBtn.addEventListener('click', () => {
    const off = skeleton.classList.toggle('no-words');
    wordsBtn.textContent = off ? 'Show words' : 'Hide words';
    wordsBtn.classList.toggle('active', off);
});

if (outlineBtn) outlineBtn.addEventListener('click', () => {
    const off = skeleton.classList.toggle('no-outline');      // also hides the paint
    outlineBtn.textContent = off ? 'Show outlines' : 'Hide outlines';
    outlineBtn.classList.toggle('active', off);
});

// bones are drawn on top of the masks, so look under the pointer for the first region mask
function regionAt(event) {
    return document.elementsFromPoint(event.clientX, event.clientY)
        .find(el => REGION_PAGES[el.id]);
}

skeleton.addEventListener('click', (event) => {
    if (presenting) return;
    const region = regionAt(event);
    if (region) window.location.href = REGION_PAGES[region.id];
});

skeleton.addEventListener('mousemove', (event) => {
    if (presenting) return;
    skeleton.style.cursor = regionAt(event) ? 'pointer' : 'default';
});


// =====================================================================
// 2. WHICH BONE ON THE INDEX SHOWS WHICH BONE ON WHICH PAGE
// =====================================================================
const SVG_NS = 'http://www.w3.org/2000/svg';
const TOTAL_BONES = 206;
const MIN_FONT = 1;    // the index is small, so fitted words can be tiny

const RIGHT_HAND_IDS = [
    'distal_phalanges_1', 'middle_phalanges_1', 'proximal_phalanges_1', 'metacarpal_bones_1',
    'distal_phalanges_2', 'middle_phalanges_2', 'proximal_phalanges_2', 'metacarpal_bones_2',
    'distal_phalanges_3', 'middle_phalanges_3', 'proximal_phalanges_3', 'metacarpal_bones_3',
    'distal_phalanges_4', 'middle_phalanges_4', 'proximal_phalanges_4', 'metacarpal_bones_4',
    'distal_phalanges_5', 'proximal_phalanges_5', 'metacarpal_bones_5',
    'hamate', 'capitate', 'trapezoid', 'trapezium', 'scaphoid', 'lunate', 'triquetrum', 'pisiform'
];
const LEFT_HAND_IDS = [
    'distal phalanges', 'middle phalanges', 'proximal phalanges', 'metacarpal bones',
    'distal phalanges_2', 'middle phalanges_2', 'proximal phalanges_2', 'metacarpal bones_2',
    'distal phalanges_3', 'middle phalanges_3', 'proximal phalanges_3', 'meracarpal bones',
    'distal phalanges_4', 'middle phalanges_4', 'proximal phalanges_4', 'metacarpal bones_3',
    'distal phalanges_5', 'proximal phalanges_5', 'metacarpal bones_4',
    'hamate', 'capitate', 'trapezoid', 'trapezium', 'scaphoid', 'lunate', 'triquetrum', 'pisiform'
];
const FOOT_IDS = [
    'distal phalanges', 'proximal phalanges', 'metatarsal bones',
    'distal phalanges_2', 'middle phalanges', 'proximal phalanges_2', 'metatarsal bones_2',
    'distal phalanges_3', 'middle phalanges_2', 'proximal phalanges_3', 'metatarsal bones_3',
    'distal phalanges_4', 'middle phalanges_3', 'proximal phalanges_4', 'metatarsal bones_4',
    'distal phalanges_5', 'middle phalanges_4', 'proximal phalanges_5', 'metatarsal bones_5',
    'median cuneiform bone', 'intermediate cuneiform bone', 'lateral cuneiform bone',
    'cuboid', 'navicular bone', 'talus(ankle bone)', 'calcenous (heel bone)'
];
const LEG_IDS = ['femur', 'patella', 'tibia', 'fibula'];

const links = [];   // each: { bone (index shape), page, id (bone id on that page), side }

function group(id) {
    return skeleton.querySelector(`g[id="${id}"]`);
}

// i-th shape in an index group = i-th bone on the page
function linkByOrder(groupId, page, pageIds) {
    const g = group(groupId);
    if (!g) return console.warn('Index group not found:', groupId);
    const shapes = g.querySelectorAll('path');
    if (shapes.length !== pageIds.length) {
        console.warn(`${groupId} has ${shapes.length} shapes but ${page} has ${pageIds.length} bones`);
    }
    shapes.forEach((bone, i) => {
        if (pageIds[i]) links.push({ bone, page, id: pageIds[i] });
    });
}

// index shapes carry the same ids as the page
function linkSameIds(groupId, page) {
    const g = group(groupId);
    if (!g) return console.warn('Index group not found:', groupId);
    g.querySelectorAll('path').forEach(bone => {
        const id = bone.id || bone.parentNode.id;   // frontal bone: the id may sit on its wrapper group
        links.push({ bone, page, id });
    });
}

// index id -> page id, written out by hand
function linkPairs(page, pairs) {
    for (const [indexId, pageId] of Object.entries(pairs)) {
        const bone = document.getElementById(indexId);
        if (bone) links.push({ bone, page, id: pageId });
        else console.warn('Index bone not found:', indexId);
    }
}

// --- the table ---
linkByOrder('Right Hand', 'Right_Hand.html', RIGHT_HAND_IDS);
linkByOrder('Right Hand_2', 'Left_Hand.html', LEFT_HAND_IDS);
linkByOrder('Right Foot_2', 'Right_Foot.html', FOOT_IDS);     // index names are swapped
linkByOrder('Right Foot', 'Left_Foot.html', FOOT_IDS);
linkByOrder('Right Leg', 'Right_Leg.html', LEG_IDS);
linkByOrder('Right Leg_2', 'Left_Leg.html', LEG_IDS);

linkPairs('Left_Arm.html', { humerus: 'humerus', radius: 'radius', ulna: 'ulna' });
linkPairs('Right_Arm.html', { humerus_2: 'humerus', radius_2: 'radius', ulna_2: 'ulna' });

linkPairs('Shoulder.html', {
    scapula: 'scapula_2', clavicle: 'clavicle_2',      // on-screen left
    scapula_2: 'scapula', clavicle_2: 'clavicle'       // on-screen right
});

linkPairs('Pelvis.html', {
    'hip bone - left': 'hip bone - right',
    'hip bone - right': 'hip bone - left'
});

linkSameIds('Spine', 'Spine.html');      // sacrum + coccyx are shared with Pelvis.html via shared.js
linkSameIds('Front View', 'Facial_Bones_Front_View.html');

// chest: one index shape per rib pair, split down the middle
linkPairs('rib.html', { sternum: 'sternum' });
for (let n = 1; n <= 12; n++) {
    const bone = document.getElementById('rib-' + n);
    if (!bone) continue;
    links.push({ bone, page: 'rib.html', id: `rib-${n}-right`, side: 'left' });   // body's right = screen left
    links.push({ bone, page: 'rib.html', id: `rib-${n}-left`, side: 'right' });
}


// =====================================================================
// 3. DRAW THE SAVED WORDS AND COLORS
// =====================================================================
const segmenter = 'Segmenter' in Intl ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
let wordsLayer = null;
let midX = 0;

function make(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const key in attrs) el.setAttribute(key, attrs[key]);
    return el;
}

function firstLetter(word) {
    if (!word) return '';
    if (segmenter) for (const part of segmenter.segment(word)) return part.segment;
    return Array.from(word)[0];
}

function onSide(side, x) {
    return !side || (side === 'left' ? x < midX : x > midX);
}

function insideBone(link, x, y) {
    return onSide(link.side, x) && link.bone.isPointInFill(new DOMPoint(x, y));
}

// bounding box of the index shape (only one half for a split rib)
function boneBox(link) {
    if (!link.side) return link.bone.getBBox();
    const total = link.bone.getTotalLength();
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let i = 0; i < 300; i++) {
        const p = link.bone.getPointAtLength(total * i / 300);
        if (!onSide(link.side, p.x)) continue;
        x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y);
        x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y);
    }
    return x0 === Infinity ? null : { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

// clip shapes so half of a rib can be painted
function sideClip(side) {
    const id = 'index-clip-' + side;
    if (!document.getElementById(id)) {
        let defs = skeleton.querySelector('defs');
        if (!defs) defs = skeleton.insertBefore(make('defs', {}), skeleton.firstChild);
        const vb = skeleton.viewBox.baseVal;
        const clip = make('clipPath', { id });
        clip.append(side === 'left'
            ? make('rect', { x: vb.x, y: vb.y, width: midX - vb.x, height: vb.height })
            : make('rect', { x: midX, y: vb.y, width: vb.x + vb.width - midX, height: vb.height }));
        defs.append(clip);
    }
    return `url(#${id})`;
}

function paintBone(link, color) {
    if (!link.side) {
        link.bone.style.fill = color;
        return;
    }
    const half = link.bone.cloneNode(false);
    half.removeAttribute('id');
    half.classList.add('index-paint');
    half.setAttribute('clip-path', sideClip(link.side));
    half.style.fill = color;
    half.style.stroke = 'none';
    half.style.pointerEvents = 'none';
    link.bone.parentNode.insertBefore(half, link.bone);   // under the outline
}

// fallback placement (same idea as placeWord in global.js), used when a save has no position info
function fit(label, bone, word, side) {
    const total = bone.getTotalLength();
    if (!total) return null;
    const N = 400;
    const step = total / N;
    const all = [];
    for (let i = 0; i < N; i++) all.push(bone.getPointAtLength(total * i / N));

    let pieces = [[all[0]]];
    for (let i = 1; i < N; i++) {
        if (Math.hypot(all[i].x - all[i - 1].x, all[i].y - all[i - 1].y) > step * 1.5) pieces.push([]);
        pieces[pieces.length - 1].push(all[i]);
    }
    pieces = pieces.map(p => p.filter(q => onSide(side, q.x))).filter(p => p.length);
    if (!pieces.length) return null;

    const main = pieces.reduce((best, p) => (p.length > best.length ? p : best));
    const stride = Math.max(1, Math.floor(main.length / 80));
    let pts = main.filter((_, i) => i % stride === 0);
    if (pts.length < 3) pts = all.filter(q => onSide(side, q.x)).filter((_, i) => i % 7 === 0);
    if (pts.length < 2) return null;

    let a = pts[0], b = pts[1], longest = 0;
    for (const p of pts) {
        for (const q of pts) {
            const d = Math.hypot(p.x - q.x, p.y - q.y);
            if (d > longest) { longest = d; a = p; b = q; }
        }
    }
    if (!longest) return null;

    let angle = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    if (angle > 90) angle -= 180;
    if (angle < -90) angle += 180;

    const nx = -(b.y - a.y) / longest;
    const ny = (b.x - a.x) / longest;
    const sideDist = pts.map(p => (p.x - a.x) * nx + (p.y - a.y) * ny);
    const thickness = Math.max(...sideDist) - Math.min(...sideDist);

    label.textContent = word;
    label.style.fontSize = '10px';
    const widthPerPx = label.getComputedTextLength() / 10 || 1;
    const size = Math.max(Math.min(longest * 0.5 / widthPerPx, thickness * 0.3), MIN_FONT);

    let x = (a.x + b.x) / 2;
    let y = (a.y + b.y) / 2;
    const inside = (px, py) => onSide(side, px) && bone.isPointInFill(new DOMPoint(px, py));
    if (!inside(x, y)) {
        const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
        const x0 = Math.min(...xs), x1 = Math.max(...xs);
        const y0 = Math.min(...ys), y1 = Math.max(...ys);
        let bestDist = Infinity;
        for (let i = 0; i <= 30; i++) {
            for (let j = 0; j <= 30; j++) {
                const px = x0 + (x1 - x0) * i / 30;
                const py = y0 + (y1 - y0) * j / 30;
                const d = Math.hypot(px - x, py - y);
                if (d < bestDist && inside(px, py)) { bestDist = d; x = px; y = py; }
            }
        }
    }
    return { x, y, angle, size };
}

function drawWord(link, saved) {
    const label = make('text', {
        class: 'bone-word',
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        'pointer-events': 'none'
    });
    wordsLayer.append(label);

    const style = parseStyle(saved.style);
    label.style.fontWeight = style.fontWeight;
    label.style.fontStyle = style.fontStyle;
    label.style.fill = style.fill || '#000';
    label.style.stroke = 'none';

    let x, y, angle, size, spacing = 0;
    const mapped = mapWord(saved, boneBox(link));

    if (mapped) {                                       // exact copy: same spot, angle and scaled size
        ({ x, y, angle, size, spacing } = mapped);
        if (!insideBone(link, x, y)) {                  // the two drawings differ a little: move inside
            const placed = fit(label, link.bone, saved.word, link.side);
            if (placed) { x = placed.x; y = placed.y; }
        }
    } else {                                            // older save: fit it, keep the chosen size ratio
        const placed = fit(label, link.bone, saved.word, link.side);
        if (!placed) { label.remove(); return; }
        const savedFit = parseFloat(saved.data && saved.data.fit);
        const savedSize = parseFloat(style.fontSize);
        const ratio = savedFit && savedSize ? savedSize / savedFit : 1;
        x = placed.x;
        y = placed.y;
        size = placed.size * ratio;
        angle = placed.angle + (parseFloat(saved.data && saved.data.tilt) || 0);
        spacing = savedSize ? (parseFloat(style.letterSpacing) || 0) * size / savedSize : 0;
    }

    label.style.fontSize = size + 'px';
    if (spacing) label.style.letterSpacing = spacing + 'px';
    label.setAttribute('x', x);
    label.setAttribute('y', y);
    label.setAttribute('transform', `rotate(${angle} ${x} ${y})`);
    label.textContent = saved.hidden ? firstLetter(saved.word) : saved.word;
}

function updateCount(store) {
    const total = Object.values(store.bones).filter(entry => entry && entry.word).length;
    const counter = document.querySelector('.page-header small');
    if (counter) counter.textContent = total + '/' + TOTAL_BONES;
}

function render() {
    // start clean (also used when coming back with the Back button)
    if (wordsLayer) wordsLayer.remove();
    skeleton.querySelectorAll('.index-paint').forEach(el => el.remove());
    links.forEach(link => { if (!link.side) link.bone.style.fill = ''; });

    wordsLayer = make('g', { id: 'index-words' });
    skeleton.append(wordsLayer);

    const sternum = document.getElementById('sternum');
    if (sternum) {
        const box = sternum.getBBox();
        midX = box.x + box.width / 2;
    }

    const store = readStore();
    links.forEach(link => {
        const entry = store.bones[boneKey(link.page, link.id)];
        if (!entry) return;
        if (entry.paint) paintBone(link, entry.paint);
        if (entry.word) drawWord(link, entry);
    });

    updateCount(store);
}

// wait for fonts so word widths are measured correctly
(document.fonts ? document.fonts.ready : Promise.resolve()).then(render);

// coming back with the Back button can show an old copy of the page: redraw it
window.addEventListener('pageshow', (event) => {
    if (event.persisted) render();
});


// =====================================================================
// 4. DOWNLOAD: 4:5 poster with the title, the skeleton as it looks now, and the footer
// =====================================================================
const indexDownloadBtn = document.querySelector('.download-btn');
const indexDialog = document.getElementById('downloadDialog');
const INDEX_PAPER = '#EFE4CB';    // same as the page background
const INDEX_FILE = 'i-am-made-up-of-206-words';

// copy of the skeleton exactly as it looks on screen
function buildIndexArt() {
    const clone = skeleton.cloneNode(true);
    const wordsOff = skeleton.classList.contains('no-words');
    const outlinesOff = skeleton.classList.contains('no-outline');

    clone.removeAttribute('class');
    clone.removeAttribute('style');

    // the click regions are page-colored shapes: invisible on screen, so keep them out of the file
    for (const id of Object.keys(REGION_PAGES)) {
        clone.querySelectorAll(`[id="${id}"]:not(g)`).forEach(el => el.remove());
    }

    // the two toggles live in the page's CSS, which the file doesn't have: write them in
    if (wordsOff) {
        const layer = clone.querySelector('#index-words');
        if (layer) layer.remove();
    }
    if (outlinesOff) {
        clone.querySelectorAll('path').forEach(path => {
            path.setAttribute('stroke', 'none');
            path.setAttribute('fill', 'none');
            path.style.stroke = 'none';
            path.style.fill = 'none';
        });
    }

    // the words' font comes from CSS too
    const sample = skeleton.querySelector('#index-words text');
    const font = sample ? getComputedStyle(sample).fontFamily : '';
    clone.querySelectorAll('#index-words text').forEach(t => {
        if (font) t.setAttribute('font-family', font);
    });
    return clone;
}

if (indexDownloadBtn && indexDialog) {
    indexDownloadBtn.addEventListener('click', () => indexDialog.showModal());

    indexDialog.addEventListener('click', (event) => {
        if (event.target === indexDialog) { indexDialog.close(); return; }   // click on the dark backdrop
        const format = event.target.dataset.format;
        if (!format || format === 'cancel') { indexDialog.close(); return; }
        indexDialog.close();

        const title = titleEl ? titleEl.textContent.trim() : '';
        const poster = format === 'svg'
            ? makePoster(buildIndexArt(), title, null, 1)
            : makePoster(buildIndexArt(), title, INDEX_PAPER, POSTER_SCALE);
        exportSvg(poster, format, INDEX_FILE);
    });
}


// =====================================================================
// 5. EDITABLE TITLE (saved in this browser)
// =====================================================================
const titleEl = document.querySelector('.page-header p');

if (titleEl) {
    titleEl.contentEditable = 'true';
    titleEl.spellcheck = false;
    titleEl.textContent = readStore().title || '';      // empty shows the "Title" placeholder

    function saveTitle() {
        const store = readStore();
        store.title = titleEl.textContent.trim();
        writeStore(store);
    }

    titleEl.addEventListener('input', saveTitle);

    // one line only: Enter finishes typing
    titleEl.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.isComposing) {
            event.preventDefault();
            titleEl.blur();
        }
    });

    // pasting keeps only the text, not its formatting
    titleEl.addEventListener('paste', (event) => {
        event.preventDefault();
        const text = (event.clipboardData.getData('text/plain') || '').replace(/\s+/g, ' ');
        document.execCommand('insertText', false, text);
    });

    // clicking empty space after typing leaves the title cleanly
    titleEl.addEventListener('blur', () => {
        if (!titleEl.textContent.trim()) titleEl.textContent = '';   // brings the placeholder back
        saveTitle();
    });
}