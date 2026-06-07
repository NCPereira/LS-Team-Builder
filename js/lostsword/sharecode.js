// ── sharecode.js v4 ───────────────────────────────────────────────────────────
// Produces compact, human-readable shareable codes using letter+number tokens.
//
// Format:  LSTB4_<tokens>
//
// Each token = one letter (field type) + decimal digits (1-based table index).
// Empty fields are omitted entirely — no padding, no separators needed.
// Stat priorities and title are NOT encoded (left to the recipient).
//
// Example:  LSTB4_c3w12a1h5r2k7c14w6a3...u4t15u9
//           c3  = character index 3 (Asuka)
//           w12 = weapon index 12
//           t15 = ult time 1.5 s
//
// Legacy V3 (LSTB3_) and V1 (LSTB1_) codes are still decoded correctly.
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

// Still used by the V3 legacy decoder path below
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

// Card helpers (still used by V3 legacy decoder)
function _cardIdx(cardStr) {
    if (!cardStr) return _SC_NONE;
    const m = cardStr.match(/^Card_(.+)_\d+$/);
    if (!m) return _SC_NONE;
    return _idx(_SC_CARDS, m[1]);
}

// Build a display-name → _SC_CARDS index map using the same parseName logic
// the game uses (split on _, camelCase → spaces, strip trailing _01 number).
// This lets us encode/decode slot.card which holds the display name.
function _scCardDisplayIndex(displayName) {
    if (!displayName) return -1;
    // Try exact match first (most names are identical, e.g. "Estheria")
    let ci = _SC_CARDS.indexOf(displayName);
    if (ci !== -1) return ci;
    // Normalise: collapse spaces, try case-insensitive
    const norm = displayName.replace(/\s+/g, '').toLowerCase();
    ci = _SC_CARDS.findIndex(n => n.toLowerCase() === norm);
    if (ci !== -1) return ci;
    // Also try matching the display form of each entry
    // (e.g. "Joan Of Arc" → "JoanOfArc", "Maid Rita" → "MaidRita")
    return _SC_CARDS.findIndex(n => {
        const disp = n.replace(/([A-Z])/g, ' $1').trim();
        return disp.toLowerCase() === displayName.toLowerCase();
    });
}

// Return the display name for a _SC_CARDS index (what the game stores in slot.card)
function _scCardDisplayName(idx) {
    const name = _val(_SC_CARDS, idx);
    if (!name) return null;
    // Replicate parseName: split camelCase to spaces
    return name.replace(/([A-Z])/g, ' $1').trim();
}

function _cardVal(idx) {
    const name = _val(_SC_CARDS, idx);
    return name ? `Card_${name}_01` : null;
}

// ══════════════════════════════════════════════════════════════════════════════
// ── V4 Text-token encoder / decoder ──────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
//
// Format:  LSTB4_<tokens>
//
// A token is one lowercase letter immediately followed by either:
//   • one or more decimal digits  → 1-based index into that field's table
//   • nothing (for 'n' = null)
//
// Token letters:
//   c  character      (1-based index into _SC_CHARS)
//   w  weapon         (1-based index into _SC_WEAPONS)
//   a  armor          (1-based index into _SC_ARMORS)
//   h  helmet         (1-based index into _SC_HELMETS)
//   r  rune           (1-based index into _SC_RUNES)
//   k  card           (1-based index into _SC_CARDS)
//   s  skin index     (0-based, written only when non-zero)
//   p  pet            (1-based index into _SC_PETS)
//   g  gem            (1-based index into _SC_GEMS)
//   f  formation slot value (0-based team-slot index; omitted for empty)
//   u  ult-rotation character (1-based index into _SC_CHARS)
//   t  ult time in tenths of a second (e.g. t15 = 1.5 s)
//   n  null / empty   (no digits; skips the next logical slot in sequence)
//   x  title text     (digits = UTF-8 byte-length, then raw UTF-8 chars follow)
//   m  comments text  (digits = UTF-8 byte-length, then raw UTF-8 chars follow)
//
// Slots are written in order: for each of 5 team slots → c w a h r k [s]
// then 3 pet slots → p g g g g [gemStat q code]
// then up to 6 formation entries → f<slotIdx>
// then ult rotation entries → u [t]  (t omitted if 0)
// then optional x (title) and m (comments)
//
// Empty / null fields are omitted entirely (shorter) or written as 'n'
// only where positional ambiguity would arise (pet gemStat preset: q1/q2/n).
//
// gemStat preset token:
//   q1  = 4×ATK/4×HP
//   q2  = 4×CD/4×HP
//   (omitted = none)
// ─────────────────────────────────────────────────────────────────────────────

const SHARE_PREFIX_V4 = 'LSTB4_';
const SHARE_PREFIX_V3 = 'LSTB3_';
const SHARE_PREFIX_V1 = 'LSTB1_';

// ── Tokenizer: turn a raw string body into [{letter, num}] ───────────────────
function _tokenize(str) {
    const tokens = [];
    // Matches: one letter, then optional run of digits, OR 'x'/'m' with
    // length+payload handled separately after the main scan.
    const re = /([a-z])(\d*)/g;
    let m;
    while ((m = re.exec(str)) !== null) {
        tokens.push({ letter: m[1], num: m[2] === '' ? null : parseInt(m[2], 10) });
    }
    return tokens;
}

// ── V4 Encoder ────────────────────────────────────────────────────────────────
function _encodeV4(payload) {
    const parts = [];

    // Helper: append a 1-based index token, or nothing if null/empty
    function tok(letter, table, val) {
        if (val == null || val === '') return;
        const i = table.indexOf(val);
        if (i === -1) return; // unknown value — skip rather than corrupt
        parts.push(letter + (i + 1));
    }

    // ── 5 team slots ─────────────────────────────────────────────────────────
    const slots = payload.slotData || [];
    for (let si = 0; si < 5; si++) {
        const s = slots[si] || {};
        const g = s.gear || {};
        tok('c', _SC_CHARS,   s.character);
        tok('w', _SC_WEAPONS, g.Weapon);
        tok('a', _SC_ARMORS,  g.Armor);
        tok('h', _SC_HELMETS, g.Helmet);
        tok('r', _SC_RUNES,   g.Rune);
        // Card: stored as display name in s.card (e.g. "Estheria", "Joan Of Arc")
        // Fallback to s.cards[0] for any legacy payload that still uses the old format
        const cardDisplay = s.card || null;
        const cardFallback = !cardDisplay ? (s.cards || [])[0] : null;
        if (cardDisplay) {
            const ci = _scCardDisplayIndex(cardDisplay);
            if (ci !== -1) parts.push('k' + (ci + 1));
        } else if (cardFallback) {
            // Legacy: Card_X_01 or bare name
            const cm = cardFallback.match(/^(?:Card_)?(.+?)(?:_\d+)?$/);
            if (cm) {
                const ci = _SC_CARDS.indexOf(cm[1]);
                if (ci !== -1) parts.push('k' + (ci + 1));
            }
        }
        // Skin index: read from the dedicated slotSkinIndex array (authoritative live state)
        // falling back to s.skinIndex on the slot object for any legacy payload
        const skin = (payload.slotSkinIndex && payload.slotSkinIndex[si] != null)
            ? payload.slotSkinIndex[si]
            : (s.skinIndex || 0);
        if (skin > 0) parts.push('s' + skin);
    }

    // ── 3 pet slots ──────────────────────────────────────────────────────────
    const pets = payload.petsData || [];
    for (let pi = 0; pi < 3; pi++) {
        const p = pets[pi] || {};
        tok('p', _SC_PETS, p.name);
        for (let gi = 0; gi < 4; gi++) {
            tok('g', _SC_GEMS, (p.gems || [])[gi]);
        }
        // gemStat preset
        const gs = p.gemStat;
        if (gs && gs.length) {
            if (gs.filter(v => v === 'CD').length  >= 4) parts.push('q2');
            else if (gs.filter(v => v === 'ATK').length >= 4) parts.push('q1');
        }
    }

    // ── Formation slots (write only filled ones as f<slotIdx>) ───────────────
    const fs = payload.formationSlots || [];
    for (let fi = 0; fi < 6; fi++) {
        const v = fs[fi];
        if (v != null && v !== -1) parts.push('f' + fi + 'v' + v);
    }

    // ── Ultimate rotation (non-null entries only) ─────────────────────────────
    const ur = payload.ultimateRotation || [];
    for (let ui = 0; ui < Math.min(ur.length, 11); ui++) {
        const e = ur[ui] || {};
        if (!e.character) continue;
        const ci = _SC_CHARS.indexOf(e.character);
        if (ci === -1) continue;
        parts.push('u' + (ci + 1));
        if (e.time) {
            const tenths = Math.round(parseFloat(e.time) * 10);
            if (tenths > 0) parts.push('t' + tenths);
        }
    }

    return parts.join('');
}

// ── V4 Decoder ────────────────────────────────────────────────────────────────
function _decodeV4(body) {
    // We parse the body character by character.
    // Letters drive state; digits accumulate the current number.
    // 'x' and 'm' use a length-prefixed raw payload.

    const slotData        = Array.from({ length: 5 }, () => ({
        character: null, gear: { Weapon: null, Armor: null, Helmet: null, Rune: null },
        cards: [], statPriority: {}, skinIndex: 0,
    }));
    const petsData        = Array.from({ length: 3 }, () => ({ name: null, gems: [null,null,null,null], gemStat: null }));
    const formationSlots  = [-1,-1,-1,-1,-1,-1];
    const ultimateRotation = [];

    let title    = 'My Lost Sword Team';
    let comments = '';

    // Slot/pet/gem write cursors
    let slotCursor = 0; // which of the 5 team slots we're filling
    let petCursor  = 0; // which of the 3 pet slots we're filling
    let gemCursor  = 0; // which gem within petCursor (0-3)
    let formPending = -1; // formation slot index waiting for 'v' value

    let i = 0;
    while (i < body.length) {
        const letter = body[i++];
        if (letter < 'a' || letter > 'z') continue; // skip unexpected chars

        // 'x' and 'm' are length-prefixed text payloads
        if (letter === 'x' || letter === 'm') {
            // Read length digits
            let lenStr = '';
            while (i < body.length && body[i] >= '0' && body[i] <= '9') lenStr += body[i++];
            const byteLen = parseInt(lenStr, 10) || 0;
            // Grab exactly byteLen characters (raw UTF-8 bytes stored as chars)
            const raw = body.slice(i, i + byteLen);
            i += byteLen;
            try {
                const bytes = new Uint8Array(raw.length);
                for (let b = 0; b < raw.length; b++) bytes[b] = raw.charCodeAt(b);
                const decoded = new TextDecoder().decode(bytes);
                // x = legacy title (ignored), m = comments
                if (letter === 'm') comments = decoded;
            } catch (_) {}
            continue;
        }

        // All other letters: read trailing digits
        let numStr = '';
        while (i < body.length && body[i] >= '0' && body[i] <= '9') numStr += body[i++];
        const num = numStr === '' ? null : parseInt(numStr, 10);

        // Dispatch
        switch (letter) {
            case 'c': { // character → advances slotCursor
                const ch = num != null ? (_SC_CHARS[num - 1] ?? null) : null;
                if (slotCursor < 5) { slotData[slotCursor].character = ch; slotCursor++; }
                break;
            }
            case 'w': {
                const slot = slotData[slotCursor - 1];
                if (slot) slot.gear.Weapon = num != null ? (_SC_WEAPONS[num - 1] ?? null) : null;
                break;
            }
            case 'a': {
                const slot = slotData[slotCursor - 1];
                if (slot) slot.gear.Armor = num != null ? (_SC_ARMORS[num - 1] ?? null) : null;
                break;
            }
            case 'h': {
                const slot = slotData[slotCursor - 1];
                if (slot) slot.gear.Helmet = num != null ? (_SC_HELMETS[num - 1] ?? null) : null;
                break;
            }
            case 'r': {
                const slot = slotData[slotCursor - 1];
                if (slot) slot.gear.Rune = num != null ? (_SC_RUNES[num - 1] ?? null) : null;
                break;
            }
            case 'k': { // card — write as display name into slot.card
                const slot = slotData[slotCursor - 1];
                if (slot && num != null) {
                    const dispName = _scCardDisplayName(num - 1);
                    if (dispName) {
                        slot.card  = dispName;   // what the game reads
                        slot.cards = [`Card_${_SC_CARDS[num-1]}_01`]; // legacy compat
                    }
                }
                break;
            }
            case 's': { // skin index
                const slot = slotData[slotCursor - 1];
                if (slot) slot.skinIndex = num ?? 0;
                break;
            }
            case 'p': { // pet name → advances petCursor
                const name = num != null ? (_SC_PETS[num - 1] ?? null) : null;
                if (petCursor < 3) {
                    petsData[petCursor].name = name;
                    petCursor++;
                    gemCursor = 0;
                }
                break;
            }
            case 'g': { // gem
                const pet = petsData[petCursor - 1];
                if (pet && gemCursor < 4) {
                    pet.gems[gemCursor++] = num != null ? (_SC_GEMS[num - 1] ?? null) : null;
                }
                break;
            }
            case 'q': { // gemStat preset
                const pet = petsData[petCursor - 1];
                if (pet) {
                    if (num === 1) pet.gemStat = ['ATK','ATK','ATK','ATK','HP','HP','HP','HP'];
                    else if (num === 2) pet.gemStat = ['CD','CD','CD','CD','HP','HP','HP','HP'];
                }
                break;
            }
            case 'f': { // formation slot index (next 'v' carries the value)
                formPending = num ?? -1;
                break;
            }
            case 'v': { // formation slot value, paired with preceding 'f'
                if (formPending >= 0 && formPending < 6 && num != null) {
                    formationSlots[formPending] = num;
                }
                formPending = -1;
                break;
            }
            case 'u': { // ult rotation character
                const ch = num != null ? (_SC_CHARS[num - 1] ?? null) : null;
                ultimateRotation.push({ character: ch, time: '' });
                break;
            }
            case 't': { // ult time (tenths of a second)
                if (ultimateRotation.length > 0 && num != null && num > 0) {
                    ultimateRotation[ultimateRotation.length - 1].time =
                        (num / 10).toFixed(1) + 's';
                }
                break;
            }
            // 'n' and anything unrecognised: no-op
        }
    }

    // Pad ult rotation to 11
    while (ultimateRotation.length < 11) ultimateRotation.push({ character: null, time: '' });

    // slotSkinIndex array (mirrored from per-slot skinIndex for compatibility)
    const slotSkinIndex = slotData.map(s => s.skinIndex || 0);

    return {
        version: 4,
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
// ── Legacy V3 decoder (binary base64url) ─────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

// Stat pack helpers (V3 only)
function _packStats(sp) {
    const types = ['Weapon','Armor','Helmet','Rune'];
    const bytes = [];
    for (const type of types) {
        const arr = (sp && sp[type]) || [];
        for (let i = 0; i < 4; i += 2) {
            const a = arr[i]   != null ? _SC_STATS.indexOf(arr[i])   : 0xF;
            const b = arr[i+1] != null ? _SC_STATS.indexOf(arr[i+1]) : 0xF;
            bytes.push(((a & 0xF) << 4) | (b & 0xF));
        }
    }
    return bytes;
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

function _decodeV3(bytes) {
    let i = 1; // skip version byte

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

    const formationSlots = [];
    for (let f = 0; f < 6; f++) {
        const v = bytes[i++];
        formationSlots.push(v === _SC_NONE ? -1 : v);
    }

    const urLen = bytes[i++];
    const ultimateRotation = [];
    for (let u = 0; u < urLen; u++) {
        const character = _val(_SC_CHARS, bytes[i++]);
        const timeTenths = bytes[i++];
        const time = timeTenths > 0 ? (timeTenths / 10).toFixed(1) + 's' : '';
        ultimateRotation.push({ character, time });
    }
    while (ultimateRotation.length < 11) ultimateRotation.push({ character: null, time: '' });

    const slotSkinIndex = [];
    for (let s = 0; s < 5; s++) slotSkinIndex.push(bytes[i++] || 0);

    let title = 'My Lost Sword Team';
    if (i < bytes.length) {
        const titleLen = bytes[i++];
        if (titleLen > 0 && i + titleLen <= bytes.length) {
            title = new TextDecoder().decode(bytes.slice(i, i + titleLen));
            i += titleLen;
        }
    }

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
 * Encode the current live preset payload into a compact V4 share code.
 * Returns a string like "LSTB4_c3w12a1h5r2..."
 *
 * V4 format: human-readable letter+number tokens, no base64, no stats.
 * Each letter names the field type; the digits that follow are the 1-based
 * index into that field's lookup table.  Empty/null fields are simply omitted.
 */
function encodePresetCode(payload) {
    const slim = { ...payload };
    delete slim.bstatDealt;
    delete slim.bstatPrev;
    delete slim.comments;
    try {
        return SHARE_PREFIX_V4 + _encodeV4(slim);
    } catch (e) {
        console.warn('[ShareCode] V4 encode failed:', e);
        return '';
    }
}

/**
 * Decode any supported share code back into a preset payload object.
 * Supports V4 (LSTB4_), V3 binary (LSTB3_), and legacy V1 (LSTB1_) formats.
 */
function decodePresetCode(code) {
    if (!code) return null;
    const trimmed = code.trim();
    try {
        if (trimmed.startsWith(SHARE_PREFIX_V4)) {
            return _decodeV4(trimmed.slice(SHARE_PREFIX_V4.length));
        }
        if (trimmed.startsWith(SHARE_PREFIX_V3)) {
            const bytes = _fromBase64url(trimmed.slice(SHARE_PREFIX_V3.length));
            return _decodeV3(bytes);
        }
        // Legacy V1 / raw base64 JSON
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
