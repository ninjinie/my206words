// =====================================================================
// 1. CLICK A REGION -> OPEN ITS PAGE
// =====================================================================
const REGION_PAGES = {
    Skull: 'Skull.html',
    shoulder: 'Shoulder.html',
    Rib: 'rib.html',
    Spine: 'Spine_Hyoid.html',
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

// bones are drawn on top of the masks, so look under the pointer for the first region mask
function regionAt(event) {
    return document.elementsFromPoint(event.clientX, event.clientY)
        .find(el => REGION_PAGES[el.id]);
}

skeleton.addEventListener('click', (event) => {
    const region = regionAt(event);
    if (region) window.location.href = REGION_PAGES[region.id];
});

skeleton.addEventListener('mousemove', (event) => {
    skeleton.style.cursor = regionAt(event) ? 'pointer' : 'default';
});


// =====================================================================
// 2. WHICH BONE ON THE INDEX SHOWS WHICH BONE ON WHICH PAGE
// =====================================================================
const SVG_NS = 'http://www.w3.org/2000/svg';
const TOTAL_BONES = 206;
const MIN_FONT = 1;    // the index is small, so words can be tiny

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
        const id = bone.id || bone.parentNode.id;   // frontal bone: the id sits on its wrapper group
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

// same idea as placeWord in global.js: put the word along the longest line of the bone
function fit(label, bone, word, side) {
    const onSide = p => !side || (side === 'left' ? p.x < midX : p.x > midX);

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
    pieces = pieces.map(p => p.filter(onSide)).filter(p => p.length);
    if (!pieces.length) return null;

    const main = pieces.reduce((best, p) => (p.length > best.length ? p : best));
    const stride = Math.max(1, Math.floor(main.length / 80));
    let pts = main.filter((_, i) => i % stride === 0);
    if (pts.length < 3) pts = all.filter(onSide).filter((_, i) => i % 7 === 0);
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
    const inside = (px, py) => bone.isPointInFill(new DOMPoint(px, py)) && onSide({ x: px });
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

    const style = document.createElement('span').style;
    style.cssText = saved.style || '';
    label.style.fontWeight = style.fontWeight;
    label.style.fontStyle = style.fontStyle;
    label.style.fill = style.fill || '#000';
    label.style.stroke = 'none';

    const placed = fit(label, link.bone, saved.word, link.side);
    if (!placed) { label.remove(); return; }

    // keep the size the person chose, relative to the bone
    const savedFit = parseFloat(saved.data && saved.data.fit);
    const savedSize = parseFloat(style.fontSize);
    const ratio = savedFit && savedSize ? savedSize / savedFit : 1;
    const size = placed.size * ratio;
    label.style.fontSize = size + 'px';

    const spacing = parseFloat(style.letterSpacing);
    if (spacing && savedSize) label.style.letterSpacing = (spacing * size / savedSize) + 'px';

    const tilt = parseFloat(saved.data && saved.data.tilt) || 0;
    label.setAttribute('x', placed.x);
    label.setAttribute('y', placed.y);
    label.setAttribute('transform', `rotate(${placed.angle + tilt} ${placed.x} ${placed.y})`);
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