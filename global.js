const stage = document.querySelector('.stage');
const svg = stage.querySelector('svg');
const input = document.getElementById('inputField');
const count = document.getElementById('count');
const settings = document.getElementById('textSettings');
const hideBtn = document.querySelector('.hide-btn');
const undoBtn = document.querySelector('.undo-btn');
const downloadBtn = document.querySelector('.download-btn');
const backLink = document.querySelector('.page-header a');
const dialog = document.getElementById('downloadDialog');
const NOT_BONES = '#discs, [id="costal cartilage"], [id="Teeth - Right View"], #Teeth';
const bones = Array.from(svg.querySelectorAll('path'))
    .filter(p => !p.closest(NOT_BONES));

const SVG_NS = 'http://www.w3.org/2000/svg';
const MIN_FONT = 6;              // smallest word size, so tiny bones still show their word
const PAPER = '#EFE4CB';         // background color of PNG/JPG downloads
const IMAGE_SCALE = 4;           // PNG/JPG are drawn 4x bigger than the SVG so they stay sharp
const SIDE_PADDING = 80;         // extra space on EACH side of a downloaded image, in SVG units
const MAX_UNDO = 100;            // how many steps Undo remembers
const words = new Map();         // bone id -> full word
const labels = new Map();        // bone id -> text element
const hidden = new Set();        // bone ids whose word is hidden (only the first letter shows)
const undoStack = [];            // each entry is a function that reverts one change
let selectedBone = null;         // bone the input is open for
let styledLabel = null;          // word the settings menu is open for
let color = null;                // paint color (null = not painting)
let hiding = false;              // true while hide mode is on

const segmenter = 'Segmenter' in Intl
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : null;

function make(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const key in attrs) el.setAttribute(key, attrs[key]);
    return el;
}

// first visible letter, keeping accents / Mongolian variation selectors attached to it
function firstLetter(word) {
    if (!word) return '';
    if (segmenter) {
        for (const part of segmenter.segment(word)) return part.segment;
    }
    return Array.from(word)[0];
}

// what a bone's label should currently display
function shown(id) {
    const word = words.get(id) || '';
    return hidden.has(id) ? firstLetter(word) : word;
}

// ---------- setup: one empty text label per bone ----------
bones.forEach(bone => {
    const box = bone.getBBox();
    const label = make('text', {
        x: box.x + box.width / 2,
        y: box.y + box.height / 2,
        class: 'bone-word'
    });
    label.dataset.bone = bone.id;          // remember which bone this word belongs to
    bone.parentNode.append(label);
    labels.set(bone.id, label);
});

count.textContent = '0/' + bones.length;

// ---------- back: return to the page you came from ----------
backLink.addEventListener('click', (event) => {
    if (document.referrer.startsWith(location.origin)) {   // we arrived from one of our own pages
        event.preventDefault();
        history.back();
    }                                                      // otherwise the normal link (index.html) runs
});

// ---------- undo ----------
function pushUndo(step) {
    undoStack.push(step);
    if (undoStack.length > MAX_UNDO) undoStack.shift();
}

function undo() {
    const step = undoStack.pop();
    if (step) step();
}

function setOrRemove(el, name, value) {
    if (value === null) el.removeAttribute(name);
    else el.setAttribute(name, value);
}

// a copy of everything that can change about one word
function snapshotLabel(id) {
    const l = labels.get(id);
    return {
        word: words.get(id),
        hidden: hidden.has(id),
        text: l.textContent,
        style: l.getAttribute('style'),
        transform: l.getAttribute('transform'),
        x: l.getAttribute('x'),
        y: l.getAttribute('y'),
        data: { ...l.dataset }
    };
}

function restoreLabel(id, snap) {
    const l = labels.get(id);

    if (snap.word === undefined) words.delete(id);
    else words.set(id, snap.word);
    if (snap.hidden) hidden.add(id);
    else hidden.delete(id);

    l.textContent = snap.text;
    setOrRemove(l, 'style', snap.style);
    setOrRemove(l, 'transform', snap.transform);
    l.setAttribute('x', snap.x);
    l.setAttribute('y', snap.y);
    for (const key of Object.keys(l.dataset)) delete l.dataset[key];
    Object.assign(l.dataset, snap.data);

    count.textContent = words.size + '/' + bones.length;
}

// call this right BEFORE changing a word, so Undo can put it back
function rememberLabel(id) {
    const snap = snapshotLabel(id);
    pushUndo(() => restoreLabel(id, snap));
}

undoBtn.addEventListener('click', undo);

// ---------- the word input (with the settings menu above it) ----------
function openInput(bone) {
    const b = bone.getBoundingClientRect();
    const s = stage.getBoundingClientRect();
    const boneIsLeft = (b.left + b.right) / 2 < (s.left + s.right) / 2;

    selectedBone = bone.id;
    input.style.display = 'block';
    input.style.top = (b.top + b.height / 2 - s.top) + 'px';
    input.style.left = (boneIsLeft ? b.left - s.left - 10 : b.right - s.left + 10) + 'px';
    input.style.transform = boneIsLeft ? 'translate(-100%, -50%)' : 'translate(0, -50%)';
    input.value = words.get(bone.id) || '';
    input.focus();
    input.select();                        // so typing replaces the old word right away

    if (words.has(bone.id)) openSettings(labels.get(bone.id));   // only written words have settings
}

function closeInput(save) {
    if (selectedBone === null) return;

    const id = selectedBone;
    const word = input.value.trim();
    selectedBone = null;
    input.style.display = 'none';          // hide FIRST, so nothing below can leave it stuck
    closeSettings();
    if (!save) return;

    if (word === (words.get(id) || '')) return;     // nothing changed: keep the word's size and tilt

    rememberLabel(id);                              // so Undo can revert this word

    if (word) {
        words.set(id, word);
    } else {
        words.delete(id);
        hidden.delete(id);                 // an erased word has nothing left to hide
    }

    placeWord(labels.get(id), document.getElementById(id), word);
    count.textContent = words.size + '/' + bones.length;
}

// one word: remove spaces, but keep the two characters Mongolian words use internally
// (U+202F narrow no-break space and U+180E vowel separator)
function stripSpaces() {
    const clean = input.value.replace(/[^\S\u202F\u180E]/g, '');
    if (clean !== input.value) input.value = clean;       // only write when something was removed
}

input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.isComposing) closeInput(true);
});
input.addEventListener('blur', () => closeInput(true));
input.addEventListener('input', (event) => {
    if (!event.isComposing) stripSpaces();                // never touch the text mid-composition
});
input.addEventListener('compositionend', stripSpaces);

// ---------- placing a word along the longest line of its bone ----------
function placeWord(label, bone, word) {
    label.textContent = word;              // measure with the FULL word, even if it ends up hidden
    if (!word) return;

    // 1) sample the outline, then split it into separate pieces.
    //    Neighbouring samples are never further apart than `step` unless the path jumped to a new piece.
    const total = bone.getTotalLength();
    const N = 400;
    const step = total / N;
    const all = [];
    for (let i = 0; i < N; i++) all.push(bone.getPointAtLength(total * i / N));

    const pieces = [[all[0]]];
    for (let i = 1; i < N; i++) {
        const jumped = Math.hypot(all[i].x - all[i - 1].x, all[i].y - all[i - 1].y) > step * 1.5;
        if (jumped) pieces.push([]);
        pieces[pieces.length - 1].push(all[i]);
    }

    // 2) use the biggest piece (the one with the longest outline); the user can drag the word to another
    const main = pieces.reduce((best, p) => (p.length > best.length ? p : best));
    const stride = Math.max(1, Math.floor(main.length / 80));
    let pts = main.filter((_, i) => i % stride === 0);
    if (pts.length < 3) pts = all.filter((_, i) => i % 7 === 0);     // tiny path: fall back to the whole outline

    // 3) find the two points furthest apart
    let a = pts[0], b = pts[1], longest = 0;
    for (const p of pts) {
        for (const q of pts) {
            const d = Math.hypot(p.x - q.x, p.y - q.y);
            if (d > longest) { longest = d; a = p; b = q; }
        }
    }

    // 4) angle of that line, flipped so text is never upside down
    let angle = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    if (angle > 90) angle -= 180;
    if (angle < -90) angle += 180;

    // 5) thickness: how far the outline reaches sideways from the line
    const nx = -(b.y - a.y) / longest;
    const ny = (b.x - a.x) / longest;
    const side = pts.map(p => (p.x - a.x) * nx + (p.y - a.y) * ny);
    const thickness = Math.max(...side) - Math.min(...side);

    // 6) font size: fit the line and the thickness, but never below MIN_FONT
    label.style.fontSize = '10px';
    const widthPerPx = label.getComputedTextLength() / 10;
    const fitted = Math.min(longest * 0.5 / widthPerPx, thickness * 0.3);
    const size = Math.max(fitted, MIN_FONT);
    label.style.fontSize = size + 'px';
    label.dataset.fit = size;

    // 7) centre on the line; if a curved piece puts that centre outside the bone, use the nearest point inside it
    let cx = (a.x + b.x) / 2;
    let cy = (a.y + b.y) / 2;
    if (!bone.isPointInFill(new DOMPoint(cx, cy))) {
        const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
        const x0 = Math.min(...xs), x1 = Math.max(...xs);
        const y0 = Math.min(...ys), y1 = Math.max(...ys);
        let bestDist = Infinity;
        for (let i = 0; i <= 30; i++) {
            for (let j = 0; j <= 30; j++) {
                const px = x0 + (x1 - x0) * i / 30;
                const py = y0 + (y1 - y0) * j / 30;
                const d = Math.hypot(px - cx, py - cy);
                if (d < bestDist && bone.isPointInFill(new DOMPoint(px, py))) {
                    bestDist = d; cx = px; cy = py;
                }
            }
        }
    }

    label.setAttribute('x', cx);
    label.setAttribute('y', cy);
    label.dataset.angle = angle;
    label.dataset.cx = cx;
    label.dataset.cy = cy;
    applyRotation(label);

    label.textContent = shown(label.dataset.bone);        // hidden words show just the first letter
}

function applyRotation(label) {
    const total = parseFloat(label.dataset.angle) + parseFloat(label.dataset.tilt || 0);
    label.setAttribute('transform', `rotate(${total} ${label.dataset.cx} ${label.dataset.cy})`);
}

// ---------- the text settings menu ----------
function openSettings(label) {
    styledLabel = label;
    const i = input.getBoundingClientRect();
    const s = stage.getBoundingClientRect();
    settings.style.display = 'flex';
    settings.style.left = (i.left + i.width / 2 - s.left) + 'px';   // centred above the input
    settings.style.top = (i.top - s.top - 10) + 'px';
    settings.style.transform = 'translate(-50%, -100%)';
}

function closeSettings() {
    settings.style.display = 'none';
    styledLabel = null;
}

// pressing a settings button must not steal focus from the input
settings.addEventListener('mousedown', (event) => event.preventDefault());

function cycle(prop, values) {
    const i = values.indexOf(styledLabel.style[prop]);
    styledLabel.style[prop] = values[(i + 1) % values.length];
}

function tilt(degrees) {
    styledLabel.dataset.tilt = parseFloat(styledLabel.dataset.tilt || 0) + degrees;
    applyRotation(styledLabel);
}

// wires one settings button: remember the word for Undo, then run the change
function onSettings(selector, action) {
    settings.querySelector(selector).addEventListener('click', () => {
        rememberLabel(styledLabel.dataset.bone);
        action();
    });
}

onSettings('.font-size', () => {
    const fit = parseFloat(styledLabel.dataset.fit);
    const now = parseFloat(styledLabel.style.fontSize);
    styledLabel.style.fontSize = (now >= fit * 1.5 ? fit * 0.6 : now + fit * 0.2) + 'px';
});
onSettings('.letter-spacing', () => cycle('letterSpacing', ['0px', '1px', '2px', '3px']));
onSettings('.bold', () => cycle('fontWeight', ['bold', 'normal']));
onSettings('.italic', () => cycle('fontStyle', ['italic', 'normal']));
onSettings('.underline', () => {
    styledLabel.style.fill = color || '#000';              // paints the word with the selected color
});
onSettings('.tilt-left', () => tilt(-5));
onSettings('.tilt-right', () => tilt(5));

// ---------- colors ----------
function setColor(value, circle) {
    color = value;
    document.querySelectorAll('.circle').forEach(c => c.classList.remove('selected'));
    if (value && circle) circle.classList.add('selected');
    stage.classList.toggle('painting', !!value);           // lets CSS change the cursor
    if (value) {                                           // entering color mode leaves the other modes
        setHiding(false);
        closeInput(true);
    }
}

function paintBone(bone) {
    const oldFill = bone.style.fill;                       // saved so Undo can restore it
    const oldPaint = bone.dataset.paint;
    pushUndo(() => {
        bone.style.fill = oldFill;
        if (oldPaint === undefined) delete bone.dataset.paint;
        else bone.dataset.paint = oldPaint;
    });

    if (bone.dataset.paint === color) {                    // same color again = remove it
        bone.style.fill = '';
        delete bone.dataset.paint;
    } else {
        bone.style.fill = color;
        bone.dataset.paint = color;
    }
}

document.querySelectorAll('.circle:not(.wheel)').forEach(circle => {
    circle.addEventListener('click', () => {
        const picked = getComputedStyle(circle).backgroundColor;
        setColor(color === picked ? null : picked, circle);   // click again = off
    });
});

const wheel = document.querySelector('.wheel');
const picker = document.getElementById('colorPicker');
picker.addEventListener('click', () => setColor(picker.value, wheel));
picker.addEventListener('input', () => setColor(picker.value, wheel));

// ---------- hide mode ----------
function setHiding(on) {
    hiding = on;
    hideBtn.classList.toggle('active', on);
    stage.classList.toggle('hiding', on);
    if (on) {                                              // entering hide mode leaves the other modes
        setColor(null);
        closeInput(true);
    }
}

function toggleHidden(id) {
    if (!words.has(id)) return;                            // nothing to hide on an empty bone
    rememberLabel(id);
    if (hidden.has(id)) hidden.delete(id);
    else hidden.add(id);
    labels.get(id).textContent = shown(id);                // first letter only, or the full word again
}

hideBtn.addEventListener('click', () => setHiding(!hiding));

// ---------- download ----------
function fileName() {
    return document.querySelector('.page-header p').textContent.trim().toLowerCase().replace(/\s+/g, '-');
}

// Copy of the SVG with everything an exported file needs written into it.
// The labels already show only the first letter of hidden words, so the full word never reaches the file.
function buildExportSvg(background, scale) {
    const clone = svg.cloneNode(true);
    const vb = svg.viewBox.baseVal;
    const font = getComputedStyle(svg.querySelector('.bone-word')).fontFamily;

    // widen the canvas sideways; the height stays exactly as it was
    const x = vb.x - SIDE_PADDING;
    const w = vb.width + 2 * SIDE_PADDING;
    clone.setAttribute('viewBox', `${x} ${vb.y} ${w} ${vb.height}`);

    clone.querySelectorAll('text').forEach(t => {
        if (!t.textContent) {
            t.remove();                                    // empty labels stay out of the file
            return;
        }
        t.setAttribute('font-family', font);               // the page's CSS isn't inside the file
        t.setAttribute('text-anchor', 'middle');
        t.setAttribute('dominant-baseline', 'middle');
        t.setAttribute('fill', '#000');                    // an inline color from the menu still wins
        t.setAttribute('stroke', 'none');
    });

    clone.removeAttribute('class');
    clone.setAttribute('width', w * scale);
    clone.setAttribute('height', vb.height * scale);

    if (background) {
        const rect = make('rect', { x, y: vb.y, width: w, height: vb.height, fill: background });
        clone.insertBefore(rect, clone.firstChild);
    }
    return new XMLSerializer().serializeToString(clone);
}

function saveBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadSvg() {
    const markup = buildExportSvg(null, 1);                // transparent, original size
    saveBlob(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }), fileName() + '.svg');
}

function downloadImage(mimeType, extension) {
    const markup = buildExportSvg(PAPER, IMAGE_SCALE);
    const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }));
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        canvas.toBlob(blob => saveBlob(blob, fileName() + '.' + extension), mimeType, 0.92);
    };
    img.src = url;
}

downloadBtn.addEventListener('click', () => {
    setColor(null);
    setHiding(false);
    dialog.showModal();
});

dialog.addEventListener('click', (event) => {
    if (event.target === dialog) { dialog.close(); return; }     // click on the dark backdrop
    const format = event.target.dataset.format;
    if (!format) return;
    dialog.close();
    if (format === 'svg') downloadSvg();
    if (format === 'png') downloadImage('image/png', 'png');
    if (format === 'jpg') downloadImage('image/jpeg', 'jpg');
});

// ---------- drag a word, staying inside its bone ----------
const DRAG_THRESHOLD = 3;        // pixels the pointer must move before it counts as a drag
let drag = null;                 // the drag in progress, if any
let suppressClick = false;       // stops the click that ends a drag from opening the input

function svgPoint(event) {
    return new DOMPoint(event.clientX, event.clientY).matrixTransform(svg.getScreenCTM().inverse());
}

function moveWord(label, x, y) {
    label.setAttribute('x', x);
    label.setAttribute('y', y);
    label.dataset.cx = x;
    label.dataset.cy = y;
    applyRotation(label);        // rotation pivots around the new centre
}

svg.addEventListener('pointerdown', (event) => {
    if (color || hiding) return;                       // dragging only in writing mode
    const label = event.target.closest('text');
    if (!label || !label.textContent) return;
    drag = {
        label,
        bone: document.getElementById(label.dataset.bone),
        id: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        moved: false
    };
    label.setPointerCapture(event.pointerId);
});

svg.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.id) return;

    if (!drag.moved) {
        const dist = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
        if (dist < DRAG_THRESHOLD) return;             // still just a click
        drag.moved = true;
        closeInput(true);                              // close the input first...
        rememberLabel(drag.label.dataset.bone);        // ...then save the state for Undo
    }

    const p = svgPoint(event);
    const cx = parseFloat(drag.label.dataset.cx);
    const cy = parseFloat(drag.label.dataset.cy);
    const inside = (x, y) => drag.bone.isPointInFill(new DOMPoint(x, y));

    if (inside(p.x, p.y)) moveWord(drag.label, p.x, p.y);      // pointer is on the bone: follow it
    else if (inside(p.x, cy)) moveWord(drag.label, p.x, cy);   // otherwise slide along one axis
    else if (inside(cx, p.y)) moveWord(drag.label, cx, p.y);
    // else: stay where it is, the word can't leave the bone
});

function endDrag(event) {
    if (!drag || event.pointerId !== drag.id) return;
    if (drag.moved) {
        suppressClick = true;
        setTimeout(() => { suppressClick = false; }, 0);
    }
    drag = null;
}
svg.addEventListener('pointerup', endDrag);
svg.addEventListener('pointercancel', endDrag);

// capture phase: runs before the stage's normal click handler
stage.addEventListener('click', (event) => {
    if (suppressClick) {
        suppressClick = false;
        event.stopImmediatePropagation();
    }
}, true);

// ---------- "Oops, not a bone" message ----------
const oops = document.createElement('div');
oops.textContent = 'Oops, not a bone';
Object.assign(oops.style, {
    position: 'fixed',
    padding: '6px 12px',
    background: '#fff',
    border: '2px solid #000',
    pointerEvents: 'none',
    display: 'none',
    zIndex: 1000
});
document.body.append(oops);
let oopsTimer = null;

function showOops(event) {
    oops.style.left = (event.clientX + 12) + 'px';
    oops.style.top = (event.clientY + 12) + 'px';
    oops.style.display = 'block';
    clearTimeout(oopsTimer);
    oopsTimer = setTimeout(() => { oops.style.display = 'none'; }, 1200);
}

// ---------- one click handler for the stage ----------
stage.addEventListener('click', (event) => {
    if (event.target.closest('#textSettings') || event.target === input) return;

    const label = event.target.closest('text');
    const bone = label
        ? document.getElementById(label.dataset.bone)      // clicked a word
        : event.target.closest('path');                    // clicked a bone

    if (!bone) {                                           // clicked empty space: back to writing mode
        closeInput(true);
        setColor(null);
        setHiding(false);
        return;
    }
    if (color) {                                           // color mode: paint or unpaint
        paintBone(bone);
        return;
    }
    if (bone.closest(NOT_BONES)) {                         // teeth, discs, cartilage: no words
        showOops(event);
        return;
    }
    if (hiding) {                                          // hide mode: hide or unhide the word
        toggleHidden(bone.id);
        return;
    }
    openInput(bone);                                       // writing mode: input (+ menu if written)
});

// ---------- keyboard ----------
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {                          // Esc: leave whatever you're in
        closeInput(false);                                 // cancel, don't save
        setColor(null);
        setHiding(false);
        return;
    }

    const isUndo = (event.metaKey || event.ctrlKey) && !event.shiftKey && event.key.toLowerCase() === 'z';
    if (!isUndo || event.target === input) return;         // inside the input, Cmd+Z undoes typing as usual
    event.preventDefault();
    undo();
});