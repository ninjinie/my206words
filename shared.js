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
    ]
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
    if (store && store.bones) return store;

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
    return store;
}

function writeStore(store) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (error) {
        console.warn('Could not save:', error);
    }
}