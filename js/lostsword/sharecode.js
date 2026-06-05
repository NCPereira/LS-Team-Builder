// ── sharecode.js v3 ───────────────────────────────────────────────────────────
// Produces short (~120-160 char) shareable codes by encoding all values as
// indices into fixed lookup tables, then base64url encoding the resulting bytes.
//
// Format:  LSTB3_<base64url bytes>
//
// Also keeps a V1/V2 legacy decoder so old codes still load correctly.
// ─────────────────────────────────────────────────────────────────────────────

// ══════════════════════════════════════════════════════════════════════════════
// ── Lookup tables (must match the actual game data in the other JS files) ────
// ══════════════════════════════════════════════════════════════════════════════

const _SC_CHARS = [
    'Agravaine','Anessa','Asuka','Balin','Bedivere','NeoBedivere','Claire',
    'Belsey','Cristina','DianCecht','Elaine','Elin','Elizabeth','Enya','Erin',
    'Esmeralda','Estheria','Ethan','Eva','Gaheris','Galahad','Gawain',
    'Guinevere','Hikage','Isabel','Isis','Isolde','Joanofarc','Jessi',
    'Karishara','Katrin','Kay','Circe','Lancelot','Lilith','Lisa','Lohengrin',
    'Lua','Lucy','Lueira','Merlin','Merry','SMerry','Mia','MorganLeFay',
    'Morgana','Morgause','Nesha','Nimue','Palamedes','Percival','Rachel','Ran',
    'Ray','Ria','Rita','MaidRita','Rowena','Sarah','Tiamat','Tristan','Urien',
    'Vivien','Yumi','Lumi',
    // display-name variants that may be stored in slotData / rotation
    'Joan Of Arc','Morgan Le Fay','S. Merry',
];

const _SC_WEAPONS = [
    'Abyssal Bow','Abyssal Greatsword','Abyssal Staff','Aquarius','Arbalest',
    'Arguros Toxos','Arondight','Balisada','Claiomh Solais Chaotic','Cosmic Axe',
    'Death Scythe','Demon Blade Hellhad','Dragon Buster','Dragon Killer',
    'Dragon Slayer','DualBlade','Durendal','Failnaught',"Fire Dragon's Banner",
    "Fire Dragon's Curved Sword","Fire Dragon's Great Bow",'Fragarach',
    'Gambanteinn','Goblin Slasher','Goddess Bow','Goddess Greatsword',
    'Goddess Staff','Heavy Bow','Holy Fire Bow','Holy Fire Staff',
    'Holy Fire Sword','Infinity Staff','Iokheira','Rampage Bow',
    'Red Dragon Tooth','Red Ribboned Bow','Red Ribboned Staff',
    'Red Ribboned Sword','Royal Cow Axe','Royal Cow Bowgun','Royal Cow Staff',
    'Sagittarius','Sumarbrander','Tempest Bow','Tempest Staff','Tempest Sword',
    'Thunderclap','Trident','Tyrfingr','Void Staff','White Feather Fan',
];

const _SC_ARMORS = [
    'Royal Cow Armor','Silver Armor','Gold Armor','Abyssal Armor','Dragon Armor',
    'Red Ribboned Robe','Tempest Armor','Gorgon Armor','Holy Fire Armor',
    'Mirror armor','Mithril armor',"Merlin's Robe",'Armor of the dead',
    "Fire Dragon's Armor",'Wild Combat Suit','Wrath of Agnes',
    'Goddess Armor','Absolute Armor',
];

const _SC_HELMETS = [
    'Abyssal Ring','Achilles Helmet','Aegis','Claiomh Solais Ring',
    'Crown Of The Dead',"Fire Dragon's Helmet",'Goddess Ring',
    'Healing Goddess Statue','Holy Fire Helmet','jade Seal','Red Hare',
    'Red Ribboned Ring','Royal Cow Crown','Stiletto Of Jealousy',
    'Tempest Helmet',"Tiamat's Signature",'Transformation Scroll',
    'Wild Hair Band','Destrutions Favor',
];

const _SC_RUNES = [
    'Abyssal Rune','Celestial Rune','Claiomh Solais Rune','Extreme Rune',
    'Goddess Rune','Holy Fire Rune','Memories Of Flame','Red Ribboned Rune',
    'Royal Cow Rune','Rune Of Healing','Rune Of Focus','Rune Of The Deep Sea',
    'Swordbringer Rune','Tempest Rune','ThunderHeart',
];

const _SC_PETS = [
    'Whitey','Gold','Neo','Nightsong','Shiba','Belle','Slime','Retriever',
    'Raccoon','Hen','Chick','Momo','Nabi','Cheese','Phoenix','Coco',
    'Midnight','Fenrir','Griffon','Athena','UnleashedEva',
    'Agravaine','Anessa','Asuka','Bedivere','NeoBedivere','Belsey','Cristina',
    'DianCecht','Elizabeth','Erin','Estheria','Eva','Galahad','Guinevere',
    'Hikage','Isabel','Joanofarc','Karishara','Katrin','Kay','Circe',
    'Lancelot','Lilith','Lisa','Lohengrin','Lua','Lueira','Merlin','SMerry',
    'Morgana','MorganLeFay','Nesha','Palamedes','MaidRita','Ran','Tiamat',
    'Tristan','Vivien','Yumi','Lumi',
];

const _SC_GEMS = [
    'amethyst-hexagon','amethyst-octagon','amethyst-round','amethyst-square',
    'emerald-hexagon','emerald-octagon','emerald-round','emerald-square',
    'opal-hexagon','opal-octagon','opal-round','opal-square',
    'ruby-hexagon','ruby-octagon','ruby-round','ruby-square',
    'sapphire-hexagon','sapphire-octagon','sapphire-round','sapphire-square',
    'topaz-hexagon','topaz-octagon','topaz-round','topaz-square',
    'turquoise-hexagon','turquoise-octagon','turquoise-round','turquoise-square',
];

// Cards stored as just the suffix after "Card_" and before "_01"
// e.g. "Card_Karishara_01" → index 29 in this list
const _SC_CARDS = [
    'Agravaine','Anessa','Asuka','Balin','Bedivere','NeoBedivere','Cain',
    'Claire','Belsey','Cristina','DianCecht','Elaine','Elin','Elizabeth',
    'Enya','Erin','Esmeralda','Estheria','Ethan','AbyssF30','Eva','Gaheris',
    'Galahad','Gawain','Guinevere','Hikage','Isabel','Isolde','JoanOfArc',
    'Jessi','Ran','Karishara','Katrin','Kay','Circe','Lancelot','Lilith',
    'Lisa','Lohengrin','Lua','Lucius','Lucy','Lueira','Rowena','AbyssF60',
    'Merlin','SMerry','Mia','Mordred','Morgana','MorganLeFay','Morgause',
    'Nesha','Nimue','Palamedes','Percival','Rachel','Ria','Rita','MaidRita',
    'Sarah','Tiamat','Tristan','Urien','Vivien','Vortigern','Yumi','Lumi',
];

const _SC_STATS = ['ATK','CD','HP','DEF','SPD','CRIT','RES'];

// Sentinel values
const _SC_NONE = 255; // null / empty slot
const _SC_UNK  = 254; // value exists but not in table (encode as literal fallback)

// ══════════════════════════════════════════════════════════════════════════════
// ── Helpers ───────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function _idx(table, val) {
    if (val == null || val === '' || val === undefined) return _SC_NONE;
    const i = table.indexOf(val);
    return i === -1 ? _SC_NONE : i;
}

function _val(table, idx) {
    if (idx === _SC_NONE || idx === _SC_UNK) return null;
    return table[idx] ?? null;
}

function _toBase64url(bytes) {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

function _fromBase64url(str) {
    const b64 = str.replace(/-/g,'+').replace(/_/g,'/');
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
}

// Pack a card display value like "Card_Karishara_01" → index byte
function _cardIdx(cardStr) {
    if (!cardStr) return _SC_NONE;
    const m = cardStr.match(/^Card_(.+)_\d+$/);
    if (!m) return _SC_NONE;
    return _idx(_SC_CARDS, m[1]);
}
function _cardVal(idx) {
    const name = _val(_SC_CARDS, idx);
    return name ? `Card_${name}_01` : null;
}

// Pack stat priority array (up to 4 stats per slot type, 2 bits each packed into bytes)
// We store up to 4 stats per gear slot type. Each stat = 4 bits (16 possible + none).
// 4 stats × 4 gear types = 16 nibbles = 8 bytes per character.
function _packStats(sp) {
    const types = ['Weapon','Armor','Helmet','Rune'];
    const bytes = [];
    for (const type of types) {
        const arr = (sp && sp[type]) || [];
        // Pack 2 stats per byte (4 bits each)
        for (let i = 0; i < 4; i += 2) {
            const a = arr[i]   != null ? _idx(_SC_STATS, arr[i])   : 0xF;
            const b = arr[i+1] != null ? _idx(_SC_STATS, arr[i+1]) : 0xF;
            bytes.push(((a & 0xF) << 4) | (b & 0xF));
        }
    }
    return bytes; // 8 bytes
}

function _unpackStats(bytes, offset) {
    const types = ['Weapon','Armor','Helmet','Rune'];
    const sp = {};
    let b = offset;
    for (const type of types) {
        const arr = [];
        for (let i = 0; i < 2; i++) {
            const byte = bytes[b++];
            const hi = (byte >> 4) & 0xF;
            const lo = byte & 0xF;
            if (hi !== 0xF) arr.push(_SC_STATS[hi] || null);
            if (lo !== 0xF) arr.push(_SC_STATS[lo] || null);
        }
        sp[type] = arr.filter(Boolean);
    }
    return { sp, nextOffset: b };
}

// ══════════════════════════════════════════════════════════════════════════════
// ── V3 Encoder ────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

const SHARE_PREFIX_V3 = 'LSTB3_';
const SHARE_PREFIX_V1 = 'LSTB1_';

function _encodeV3(payload) {
    const out = [];

    // Header byte: version = 3
    out.push(3);

    // ── Slots (always 5) ─────────────────────────────────────────────────────
    const slots = payload.slotData || [];
    for (let i = 0; i < 5; i++) {
        const s = slots[i] || {};
        const g = s.gear || {};
        out.push(_idx(_SC_CHARS,   s.character));
        out.push(_idx(_SC_WEAPONS, g.Weapon));
        out.push(_idx(_SC_ARMORS,  g.Armor));
        out.push(_idx(_SC_HELMETS, g.Helmet));
        out.push(_idx(_SC_RUNES,   g.Rune));
        // First card only (most builds use one)
        out.push(_cardIdx((s.cards || [])[0]));
        // Stat priority: 8 bytes
        _packStats(s.statPriority).forEach(b => out.push(b));
        // Skin index (0-7 fits in one byte)
        out.push(s.skinIndex || 0);
    }

    // ── Pets (always 3) ──────────────────────────────────────────────────────
    const pets = payload.petsData || [];
    for (let i = 0; i < 3; i++) {
        const p = pets[i] || {};
        out.push(_idx(_SC_PETS, p.name));
        for (let g = 0; g < 4; g++) out.push(_idx(_SC_GEMS, (p.gems || [])[g]));
        // gemStat preset: 0=none, 1=4×ATK/4×HP, 2=4×CD/4×HP, 15=custom
        const gs = p.gemStat;
        let gsCode = 0;
        if (gs && gs.length) {
            if (gs.filter(s => s === 'CD').length >= 4) gsCode = 2;
            else if (gs.filter(s => s === 'ATK').length >= 4) gsCode = 1;
            else gsCode = 15;
        }
        out.push(gsCode);
    }

    // ── Formation slots (6 bytes) ─────────────────────────────────────────────
    const fs = payload.formationSlots || [-1,-1,-1,-1,-1,-1];
    for (let i = 0; i < 6; i++) {
        const v = fs[i];
        out.push((v == null || v === -1) ? _SC_NONE : v);
    }

    // ── Ultimate rotation ─────────────────────────────────────────────────────
    const ur = payload.ultimateRotation || [];
    // Count non-null entries up to 11
    const urLen = Math.min(ur.length, 11);
    out.push(urLen);
    for (let i = 0; i < urLen; i++) {
        const u = ur[i] || {};
        out.push(_idx(_SC_CHARS, u.character));
        // time as tenths of a second (0-255 = 0 to 25.5s), 0 = no time shown
        const t = u.time ? Math.round(parseFloat(u.time) * 10) : 0;
        out.push(Math.min(Math.max(t, 0), 255));
    }

    // ── slotSkinIndex (5 bytes) ───────────────────────────────────────────────
    const ssi = payload.slotSkinIndex || [0,0,0,0,0];
    for (let i = 0; i < 5; i++) out.push(ssi[i] || 0);

    // ── Title: length-prefixed UTF-8 (max 60 chars) ───────────────────────────
    const title = (payload.title || 'My Lost Sword Team').slice(0, 60);
    const titleBytes = new TextEncoder().encode(title);
    out.push(titleBytes.length);
    titleBytes.forEach(b => out.push(b));

    // ── Comments (max 200 chars) ──────────────────────────────────────────────
    const comments = (payload.comments || '').slice(0, 200);
    const commentBytes = new TextEncoder().encode(comments);
    // 2-byte length (big-endian)
    out.push((commentBytes.length >> 8) & 0xFF);
    out.push(commentBytes.length & 0xFF);
    commentBytes.forEach(b => out.push(b));

    return new Uint8Array(out);
}

function _decodeV3(bytes) {
    let i = 1; // skip version byte

    // ── Slots ─────────────────────────────────────────────────────────────────
    const slotData = [];
    for (let s = 0; s < 5; s++) {
        const character = _val(_SC_CHARS,   bytes[i++]);
        const weapon    = _val(_SC_WEAPONS, bytes[i++]);
        const armor     = _val(_SC_ARMORS,  bytes[i++]);
        const helmet    = _val(_SC_HELMETS, bytes[i++]);
        const rune      = _val(_SC_RUNES,   bytes[i++]);
        const card      = _cardVal(bytes[i++]);
        const { sp, nextOffset } = _unpackStats(bytes, i);
        i = nextOffset;
        const skinIndex = bytes[i++] || 0;
        slotData.push({
            character,
            gear: { Weapon: weapon, Armor: armor, Helmet: helmet, Rune: rune },
            cards: card ? [card] : [],
            statPriority: sp,
            skinIndex,
        });
    }

    // ── Pets ──────────────────────────────────────────────────────────────────
    const petsData = [];
    for (let p = 0; p < 3; p++) {
        const name = _val(_SC_PETS, bytes[i++]);
        const gems = [];
        for (let g = 0; g < 4; g++) gems.push(_val(_SC_GEMS, bytes[i++]));
        const gsCode = bytes[i++];
        let gemStat = null;
        if (gsCode === 1) gemStat = ['ATK','ATK','ATK','ATK','HP','HP','HP','HP'];
        else if (gsCode === 2) gemStat = ['CD','CD','CD','CD','HP','HP','HP','HP'];
        petsData.push({ name, gems, gemStat });
    }

    // ── Formation ─────────────────────────────────────────────────────────────
    const formationSlots = [];
    for (let f = 0; f < 6; f++) {
        const v = bytes[i++];
        formationSlots.push(v === _SC_NONE ? -1 : v);
    }

    // ── Ultimate rotation ─────────────────────────────────────────────────────
    const urLen = bytes[i++];
    const ultimateRotation = [];
    for (let u = 0; u < urLen; u++) {
        const character = _val(_SC_CHARS, bytes[i++]);
        const timeTenths = bytes[i++];
        const time = timeTenths > 0 ? (timeTenths / 10).toFixed(1) + 's' : '';
        ultimateRotation.push({ character, time });
    }
    // Pad to 11
    while (ultimateRotation.length < 11) ultimateRotation.push({ character: null, time: '' });

    // ── slotSkinIndex ─────────────────────────────────────────────────────────
    const slotSkinIndex = [];
    for (let s = 0; s < 5; s++) slotSkinIndex.push(bytes[i++] || 0);

    // ── Title ─────────────────────────────────────────────────────────────────
    let title = 'My Lost Sword Team';
    if (i < bytes.length) {
        const titleLen = bytes[i++];
        if (titleLen > 0 && i + titleLen <= bytes.length) {
            title = new TextDecoder().decode(bytes.slice(i, i + titleLen));
            i += titleLen;
        }
    }

    // ── Comments ──────────────────────────────────────────────────────────────
    let comments = '';
    if (i + 1 < bytes.length) {
        const commentsLen = (bytes[i] << 8) | bytes[i + 1];
        i += 2;
        if (commentsLen > 0 && i + commentsLen <= bytes.length) {
            comments = new TextDecoder().decode(bytes.slice(i, i + commentsLen));
        }
    }

    return {
        version: 3,
        title,
        comments,
        slotData,
        petsData,
        formationSlots,
        ultimateRotation,
        slotSkinIndex,
        brawlKillCount: null,
        bstatDealt: null,
        bstatPrev: null,
    };
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Legacy V1 decoder (base64url of LZ-compressed JSON) ──────────────────────
// ══════════════════════════════════════════════════════════════════════════════

const _LZ_LEGACY = (() => {
    function decompress(bytes) {
        const out = [];
        let i = 0;
        while (i < bytes.length) {
            const b = bytes[i++];
            if (b & 0x80) {
                const len   = (b & 0x3f) + 4;
                const off   = ((b & 0x40) << 2) | bytes[i++];
                const start = out.length - (off + 1);
                for (let k = 0; k < len; k++) out.push(out[start + k]);
            } else {
                out.push(b);
            }
        }
        return new TextDecoder().decode(new Uint8Array(out));
    }
    return { decompress };
})();

function _decodeV1(code) {
    try {
        const b64    = code.startsWith(SHARE_PREFIX_V1) ? code.slice(SHARE_PREFIX_V1.length) : code;
        const bytes  = _fromBase64url(b64);
        const json   = _LZ_LEGACY.decompress(bytes);
        return JSON.parse(json);
    } catch (e) {
        // Try raw JSON base64
        try {
            const bytes = _fromBase64url(code.startsWith(SHARE_PREFIX_V1) ? code.slice(SHARE_PREFIX_V1.length) : code);
            return JSON.parse(new TextDecoder().decode(bytes));
        } catch (_) {
            return null;
        }
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Public API ────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Encode the current live preset payload into a compact share code.
 * Returns a string like "LSTB3_ABC123..."  (~120-160 chars typical)
 */
function encodePresetCode(payload) {
    const slim = { ...payload };
    delete slim.bstatDealt;
    delete slim.bstatPrev;
    // Include comments from the textarea if present
    const ta = document.getElementById('comments-textarea');
    if (ta) slim.comments = ta.value || '';
    try {
        const bytes = _encodeV3(slim);
        return SHARE_PREFIX_V3 + _toBase64url(bytes);
    } catch (e) {
        console.warn('[ShareCode] V3 encode failed, falling back:', e);
        // Fallback: just base64url the JSON
        const json = JSON.stringify(slim);
        return SHARE_PREFIX_V1 + _toBase64url(new TextEncoder().encode(json));
    }
}

/**
 * Decode any supported share code back into a preset payload object.
 * Supports V3 (LSTB3_) and legacy V1 (LSTB1_) formats.
 */
function decodePresetCode(code) {
    if (!code) return null;
    const trimmed = code.trim();
    try {
        if (trimmed.startsWith(SHARE_PREFIX_V3)) {
            const bytes = _fromBase64url(trimmed.slice(SHARE_PREFIX_V3.length));
            return _decodeV3(bytes);
        }
        // Legacy V1 / raw base64
        return _decodeV1(trimmed);
    } catch (e) {
        console.warn('[ShareCode] decode failed:', e);
        return null;
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Local code history (IndexedDB) ────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

const _SC_IDB_NAME    = 'lstb-sharecodes';
const _SC_IDB_STORE   = 'codes';
const _SC_IDB_VERSION = 1;
let   _scIdb          = null;

function _openScIdb() {
    if (_scIdb) return Promise.resolve(_scIdb);
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(_SC_IDB_NAME, _SC_IDB_VERSION);
        req.onupgradeneeded = e => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(_SC_IDB_STORE))
                db.createObjectStore(_SC_IDB_STORE, { keyPath: 'code' });
        };
        req.onsuccess = e => { _scIdb = e.target.result; resolve(_scIdb); };
        req.onerror   = e => reject(e.target.error);
    });
}

async function _scSaveCode(code, title) {
    try {
        const db  = await _openScIdb();
        await new Promise((res, rej) => {
            const tx  = db.transaction(_SC_IDB_STORE, 'readwrite');
            const req = tx.objectStore(_SC_IDB_STORE).put({ code, title, savedAt: Date.now() });
            req.onsuccess = () => res();
            req.onerror   = () => rej(req.error);
        });
        // Prune to most recent 20
        const all = await _scListCodes();
        if (all.length > 20) {
            const db2 = await _openScIdb();
            for (const entry of all.slice(0, all.length - 20)) {
                await new Promise(res => {
                    const tx = db2.transaction(_SC_IDB_STORE, 'readwrite');
                    tx.objectStore(_SC_IDB_STORE).delete(entry.code);
                    tx.oncomplete = res;
                });
            }
        }
    } catch (e) { console.warn('[ShareCode] save history failed:', e); }
}

async function _scListCodes() {
    try {
        const db = await _openScIdb();
        return new Promise((resolve, reject) => {
            const tx  = db.transaction(_SC_IDB_STORE, 'readonly');
            const req = tx.objectStore(_SC_IDB_STORE).getAll();
            req.onsuccess = e => resolve((e.target.result || []).sort((a, b) => a.savedAt - b.savedAt));
            req.onerror   = e => reject(e.target.error);
        });
    } catch (e) { return []; }
}

async function _scDeleteCode(code) {
    try {
        const db = await _openScIdb();
        await new Promise((res, rej) => {
            const tx  = db.transaction(_SC_IDB_STORE, 'readwrite');
            const req = tx.objectStore(_SC_IDB_STORE).delete(code);
            req.onsuccess = () => res();
            req.onerror   = () => rej(req.error);
        });
    } catch (e) { console.warn('[ShareCode] delete history failed:', e); }
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Share Code Modal ──────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function showShareCodeModal() {
    const title   = document.querySelector('h1[contenteditable]')?.innerText?.trim() || 'My Lost Sword Team';
    const payload = _buildPresetPayload(title);
    const code    = encodePresetCode(payload);

    _scSaveCode(code, title);

    const modal   = document.getElementById('share-code-modal');
    const codeEl  = document.getElementById('share-code-value');
    const titleEl = document.getElementById('share-code-title');
    const sizeEl  = document.getElementById('share-code-size');

    if (titleEl) titleEl.textContent = title;
    if (codeEl)  codeEl.value = code;
    if (modal)   modal.classList.remove('hidden');
    if (sizeEl)  sizeEl.textContent = `${code.length} characters`;
}

function closeShareCodeModal() {
    document.getElementById('share-code-modal')?.classList.add('hidden');
    _resetShareCopyBtn();
}

function copyShareCode() {
    const codeEl = document.getElementById('share-code-value');
    if (!codeEl) return;
    navigator.clipboard.writeText(codeEl.value).then(() => {
        const btn = document.getElementById('share-copy-btn');
        if (!btn) return;
        const orig = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check mr-2"></i>Copied!';
        btn.style.borderColor = '#059669';
        btn.style.color       = '#34d399';
        btn.style.background  = '#021a0e';
        setTimeout(() => {
            btn.innerHTML = orig;
            btn.style.borderColor = btn.style.color = btn.style.background = '';
        }, 2200);
    }).catch(() => { codeEl.select(); document.execCommand('copy'); });
}

function _resetShareCopyBtn() {
    const btn = document.getElementById('share-copy-btn');
    if (!btn) return;
    btn.innerHTML = '<i class="fa-solid fa-copy mr-2"></i>Copy Code';
    btn.style.borderColor = btn.style.color = btn.style.background = '';
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Load-from-Code Modal (standalone, accessible from footer) ─────────────────
// ══════════════════════════════════════════════════════════════════════════════

function showLoadCodeModal() {
    let modal = document.getElementById('load-code-modal-standalone');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'load-code-modal-standalone';
        modal.style.cssText = [
            'position:fixed','inset:0','z-index:220',
            'display:flex','align-items:center','justify-content:center',
            'background:rgba(0,0,0,0.85)','backdrop-filter:blur(4px)',
        ].join(';');
        modal.innerHTML = `
        <div style="background:#181a24;border:1px solid #2d3142;border-radius:1.25rem;
                    box-shadow:0 0 60px rgba(75,107,251,0.18);
                    width:480px;max-width:95vw;overflow:hidden;display:flex;flex-direction:column;">
            <!-- Header -->
            <div style="display:flex;align-items:center;justify-content:space-between;
                        padding:18px 20px 14px;border-bottom:1px solid #2d3142;
                        background:linear-gradient(135deg,#0f111a 0%,#181a2a 100%);">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:32px;height:32px;border-radius:8px;
                                background:linear-gradient(135deg,#1e40af,#4b6bfb);
                                display:flex;align-items:center;justify-content:center;
                                box-shadow:0 0 14px #4b6bfb55;">
                        <i class="fa-solid fa-file-import" style="font-size:14px;color:#fff;"></i>
                    </div>
                    <div>
                        <div style="font-size:14px;font-weight:800;color:#e2e8f0;">Load from Code</div>
                        <div style="font-size:10px;color:#64748b;margin-top:1px;">Paste any LSTB share code to restore a team</div>
                    </div>
                </div>
                <button onclick="closeLoadCodeModal()"
                    style="background:none;border:none;cursor:pointer;color:#475569;font-size:18px;
                           line-height:1;padding:4px;border-radius:6px;transition:color 0.15s,background 0.15s;"
                    onmouseover="this.style.color='#f8fafc';this.style.background='#ffffff15'"
                    onmouseout="this.style.color='#475569';this.style.background='none'">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <!-- Body -->
            <div style="padding:20px;display:flex;flex-direction:column;gap:14px;">
                <div style="font-size:11px;color:#64748b;display:flex;align-items:center;gap:6px;">
                    <i class="fa-solid fa-circle-info" style="color:#4b6bfb;"></i>
                    Works with all code formats: <span style="color:#7c9dff;font-family:monospace;font-size:10px;">LSTB3_...</span>
                    and older <span style="color:#a78bfa;font-family:monospace;font-size:10px;">LSTB1_...</span> codes.
                </div>
                <!-- Input -->
                <textarea id="lc-modal-input" rows="4" placeholder="Paste share code here…&#10;(LSTB3_...  or  LSTB1_...)"
                    style="width:100%;box-sizing:border-box;background:#0f111a;border:1.5px solid #2d3142;
                           border-radius:10px;padding:12px 14px;font-size:10.5px;
                           font-family:'Courier New',Courier,monospace;color:#7c9dff;
                           letter-spacing:0.02em;line-height:1.6;resize:none;outline:none;
                           word-break:break-all;color-scheme:dark;transition:border-color 0.2s;"
                    onfocus="this.style.borderColor='#4b6bfb'"
                    onblur="this.style.borderColor='#2d3142'"
                    onkeydown="if(event.key==='Enter'&&(event.ctrlKey||event.metaKey))applyLoadCodeModal()"></textarea>
                <!-- Status -->
                <div id="lc-modal-status" style="font-size:11px;color:#64748b;min-height:16px;text-align:center;"></div>
                <!-- Actions -->
                <div style="display:flex;gap:8px;">
                    <button onclick="applyLoadCodeModal()"
                        style="flex:1;background:#0d1a36;border:1.5px solid #4b6bfb;border-radius:8px;
                               padding:10px 0;font-size:13px;font-weight:700;color:#7c9dff;cursor:pointer;
                               transition:all 0.15s;display:flex;align-items:center;justify-content:center;gap:8px;"
                        onmouseover="this.style.background='#1e2240';this.style.borderColor='#7c9dff';this.style.color='#bfdbfe'"
                        onmouseout="this.style.background='#0d1a36';this.style.borderColor='#4b6bfb';this.style.color='#7c9dff'">
                        <i class="fa-solid fa-file-import" style="font-size:12px;"></i>Load Team
                    </button>
                    <button onclick="closeLoadCodeModal()"
                        style="background:#20222f;border:1px solid #2d3142;border-radius:8px;
                               padding:10px 18px;font-size:12px;font-weight:600;color:#64748b;
                               cursor:pointer;transition:all 0.15s;"
                        onmouseover="this.style.borderColor='#4b6bfb';this.style.color='#94a3b8'"
                        onmouseout="this.style.borderColor='#2d3142';this.style.color='#64748b'">
                        Cancel
                    </button>
                </div>
                <!-- Recent history -->
                <div>
                    <div style="font-size:9px;font-weight:700;color:#475569;text-transform:uppercase;
                                letter-spacing:0.1em;margin-bottom:6px;">Recently Loaded</div>
                    <div id="lc-modal-history" style="max-height:110px;overflow-y:auto;"></div>
                </div>
            </div>
        </div>`;
        modal.addEventListener('click', e => { if (e.target === modal) closeLoadCodeModal(); });
        document.body.appendChild(modal);
    }

    modal.style.display = 'flex';
    setTimeout(() => document.getElementById('lc-modal-input')?.focus(), 80);
    _renderLoadCodeHistory('lc-modal-history');
}

function closeLoadCodeModal() {
    const modal = document.getElementById('load-code-modal-standalone');
    if (modal) modal.style.display = 'none';
}

function _setLcStatus(msg, type) {
    const el = document.getElementById('lc-modal-status');
    if (!el) return;
    el.textContent = msg;
    el.style.color = type === 'error' ? '#f87171' : type === 'success' ? '#34d399' : '#64748b';
}

async function applyLoadCodeModal() {
    const input = document.getElementById('lc-modal-input');
    if (!input) return;
    const code = input.value.trim();
    if (!code) { _setLcStatus('Paste a share code first.', 'error'); return; }

    _setLcStatus('Decoding…', 'info');
    const payload = decodePresetCode(code);
    if (!payload || !payload.slotData) {
        _setLcStatus('Invalid code — make sure you copied the full code.', 'error');
        return;
    }

    const title = payload.title || 'Shared Preset';
    await _scSaveCode(code, title);
    _applyPreset(payload);
    _setLcStatus(`✓ Loaded "${title}"`, 'success');
    input.value = '';
    setTimeout(() => closeLoadCodeModal(), 1200);
}

async function _renderLoadCodeHistory(containerId) {
    const list = document.getElementById(containerId);
    if (!list) return;
    const entries = await _scListCodes();
    if (!entries.length) {
        list.innerHTML = '<div style="font-size:10px;color:#475569;font-style:italic;padding:4px 0;">No codes loaded yet.</div>';
        return;
    }
    list.innerHTML = '';
    [...entries].reverse().forEach(entry => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid #2d314230;';
        const d = new Date(entry.savedAt);
        const dateStr = `${d.getMonth()+1}/${d.getDate()}`;
        const shortCode = entry.code.length > 32 ? entry.code.slice(0, 28) + '…' : entry.code;
        row.innerHTML = `
            <button title="Load" style="flex:1;text-align:left;background:none;border:none;cursor:pointer;padding:0;"
                onclick="document.getElementById('lc-modal-input').value=${JSON.stringify(entry.code)};applyLoadCodeModal();">
                <span style="font-size:11px;color:#94a3b8;font-weight:600;">${_esc(entry.title || 'Preset')}</span>
                <span style="font-size:9px;color:#475569;margin-left:6px;">${dateStr}</span>
                <span style="display:block;font-size:9px;color:#334155;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:300px;">${_esc(shortCode)}</span>
            </button>
            <button title="Delete" onclick="deleteLoadCodeHistory(${JSON.stringify(entry.code)},${JSON.stringify(containerId)})"
                style="background:none;border:none;cursor:pointer;color:#475569;font-size:11px;
                       padding:2px 4px;border-radius:3px;transition:color 0.15s;flex-shrink:0;"
                onmouseover="this.style.color='#f87171'" onmouseout="this.style.color='#475569'">
                <i class="fa-solid fa-trash" style="font-size:9px;"></i>
            </button>`;
        list.appendChild(row);
    });
}

function _esc(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

async function deleteLoadCodeHistory(code, containerId) {
    await _scDeleteCode(code);
    _renderLoadCodeHistory(containerId || 'lc-modal-history');
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Legacy inline load-code panel (inside preset dropdown) ────────────────────
// ── Kept for backwards-compatibility with existing HTML ───────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function toggleLoadCodePanel() {
    const panel   = document.getElementById('load-code-panel');
    const chevron = document.getElementById('load-code-chevron');
    if (!panel) return;
    const isHidden = panel.classList.contains('hidden');
    panel.classList.toggle('hidden');
    if (chevron) chevron.style.transform = isHidden ? 'rotate(180deg)' : '';
    if (!isHidden) return;
    _renderLoadCodeHistory('code-history-list');
    setTimeout(() => document.getElementById('load-code-input')?.focus(), 80);
}

function closeLoadCodePanel() {
    document.getElementById('load-code-panel')?.classList.add('hidden');
    const chevron = document.getElementById('load-code-chevron');
    if (chevron) chevron.style.transform = '';
}

async function applyLoadCode() {
    const input = document.getElementById('load-code-input');
    if (!input) return;
    const code = input.value.trim();
    if (!code) { _setLoadCodeStatus('Paste a share code first.', 'error'); return; }

    _setLoadCodeStatus('Decoding…', 'info');
    const payload = decodePresetCode(code);
    if (!payload || !payload.slotData) {
        _setLoadCodeStatus('Invalid code — check you copied the full code.', 'error');
        return;
    }

    const title = payload.title || 'Shared Preset';
    await _scSaveCode(code, title);
    _applyPreset(payload);
    _setLoadCodeStatus(`✓ Loaded "${title}"`, 'success');
    input.value = '';
    setTimeout(() => {
        closeLoadCodePanel();
        document.getElementById('preset-dropdown')?.classList.add('hidden');
    }, 1200);
}

function _setLoadCodeStatus(msg, type) {
    const el = document.getElementById('load-code-status');
    if (!el) return;
    el.textContent = msg;
    el.style.color = type === 'error' ? '#f87171' : type === 'success' ? '#34d399' : '#64748b';
}

// ── History helpers (used by inline panel) ────────────────────────────────────

function loadCodeFromHistory(code) {
    const input = document.getElementById('load-code-input');
    if (input) input.value = code;
    applyLoadCode();
}

async function deleteCodeFromHistory(code) {
    await _scDeleteCode(code);
    _renderLoadCodeHistory('code-history-list');
}

// ══════════════════════════════════════════════════════════════════════════════
// ── DOM wiring ────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    // Enter key in inline load panel
    document.getElementById('load-code-input')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') applyLoadCode();
    });

    // ── Inject "Load Code" button into footer ─────────────────────────────────
    // Inserts right after the Share Code button so it's always visible
    const shareBtn = document.querySelector('[onclick="showShareCodeModal()"]');
    if (shareBtn && !document.getElementById('footer-load-code-btn')) {
        const btn = document.createElement('button');
        btn.id = 'footer-load-code-btn';
        btn.className = 'bg-[#1a1e2e] border border-indigo-700 hover:bg-indigo-900/40 text-indigo-400 text-xs font-semibold py-2 px-4 rounded-lg transition-all flex items-center gap-2';
        btn.title = 'Load a team from a share code';
        btn.innerHTML = '<i class="fa-solid fa-file-import"></i>Load Code';
        btn.onclick = showLoadCodeModal;
        shareBtn.insertAdjacentElement('afterend', btn);
    }

    // ── Hook into save flow to show "Share?" toast after saving ──────────────
    const _origConfirm = window.confirmSaveToFolder;
    if (typeof _origConfirm === 'function') {
        window.confirmSaveToFolder = async function(subfolderName) {
            await _origConfirm.call(this, subfolderName);
            _promptShareAfterSave();
        };
    }
});

// ══════════════════════════════════════════════════════════════════════════════
// ── "Share after save" toast ──────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function _promptShareAfterSave() {
    document.getElementById('share-after-save-toast')?.remove();
    const toast = document.createElement('div');
    toast.id = 'share-after-save-toast';
    toast.style.cssText = [
        'position:fixed','bottom:80px','right:20px','z-index:300',
        'background:#1a1030','border:1px solid #a78bfa','border-radius:10px',
        'padding:10px 14px','display:flex','align-items:center','gap:10px',
        'box-shadow:0 4px 24px rgba(124,58,237,0.35)',
        'animation:scShareFadeIn 0.25s ease',
    ].join(';');
    toast.innerHTML = `
        <i class="fa-solid fa-share-nodes" style="color:#a78bfa;font-size:14px;flex-shrink:0;"></i>
        <span style="font-size:12px;color:#c4b5fd;font-weight:600;white-space:nowrap;">Want to share this preset?</span>
        <button onclick="document.getElementById('share-after-save-toast').remove();showShareCodeModal();"
            style="background:#7c3aed;border:none;border-radius:6px;padding:4px 10px;font-size:11px;
                   font-weight:700;color:#fff;cursor:pointer;white-space:nowrap;transition:background 0.15s;"
            onmouseover="this.style.background='#6d28d9'" onmouseout="this.style.background='#7c3aed'">Share Code</button>
        <button onclick="this.closest('#share-after-save-toast').remove()"
            style="background:none;border:none;cursor:pointer;color:#64748b;font-size:14px;line-height:1;
                   padding:2px;flex-shrink:0;"
            onmouseover="this.style.color='#94a3b8'" onmouseout="this.style.color='#64748b'">✕</button>`;
    if (!document.getElementById('sc-toast-kf')) {
        const s = document.createElement('style');
        s.id = 'sc-toast-kf';
        s.textContent = '@keyframes scShareFadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}';
        document.head.appendChild(s);
    }
    document.body.appendChild(toast);
    setTimeout(() => toast.parentNode && toast.remove(), 6000);
}
