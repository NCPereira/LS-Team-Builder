// ── skins.js ──────────────────────────────────────────────────────────────────
// Skin candidate data, runtime probe logic, and skin cycling helpers.
// Loaded before index.html scripts that depend on these globals.

// ── Skin Database — runtime-detected ─────────────────────────────────────────
// Maps character display name → candidate filenames to probe (up to _03).
// On first render for each character, we fire off image probes for each
// candidate. Only confirmed-existing files end up in _resolvedSkins.
// This means no button appears and no extra slots exist for missing files.

// Candidate filename stems per character (internal file name, no extension).
// These are the POSSIBLE names; actual existence is confirmed at runtime.
const _skinCandidates = {
    'Agravaine':     ['Sk_Agravaine_01',   'Sk_Agravaine_02',   'Sk_Agravaine_03'],
    'Anessa':        ['Sk_Anessa_01',       'Sk_Anessa_02',      'Sk_Anessa_03'],
    'Asuka':         ['Sk_Asuka_01',        'Sk_Asuka_02',       'Sk_Asuka_03'],
    'Balin':         ['Sk_Balin_01',        'Sk_Balin_02',       'Sk_Balin_03'],
    'Bedivere':      ['Sk_Bedivere_01',     'Sk_Bedivere_02',    'Sk_Bedivere_03'],
    'Neo Bedivere':  ['Sk_NeoBedivere_01',  'Sk_NeoBedivere_02', 'Sk_NeoBedivere_03'],
    'Circe':         ['Sk_Circe_01',        'Sk_Circe_02',       'Sk_Circe_03'],
    'Claire':        ['Sk_Claire_01',       'Sk_Claire_02',      'Sk_Claire_03'],
    'Cowqueen':      ['Sk_CowQueen_01',     'Sk_CowQueen_02',    'Sk_CowQueen_03'],
    'Cow Queen':     ['Sk_CowQueen_01',     'Sk_CowQueen_02',    'Sk_CowQueen_03'],
    'Cristina':      ['Sk_Cristina_01',     'Sk_Cristina_02',    'Sk_Cristina_03'],
    'Dian Cecht':    ['Sk_DianCecht_01',    'Sk_DianCecht_02',   'Sk_DianCecht_03'],
    'Elaine':        ['Sk_Elaine_01',       'Sk_Elaine_02',      'Sk_Elaine_03'],
    'Elin':          ['Sk_Elin_01',         'Sk_Elin_02',        'Sk_Elin_03'],
    'Elizabeth':     ['Sk_Elizabeth_01',    'Sk_Elizabeth_02',   'Sk_Elizabeth_03'],
    'Enya':          ['Sk_Enya_01',         'Sk_Enya_02',        'Sk_Enya_03'],
    'Erin':          ['Sk_Erin_01',         'Sk_Erin_02',        'Sk_Erin_03'],
    'Esmeralda':     ['Sk_Esmeralda_01',    'Sk_Esmeralda_02',   'Sk_Esmeralda_03'],
    'Estheria':      ['Sk_Estheria_01',     'Sk_Estheria_02',    'Sk_Estheria_03'],
    'Ethan':         ['Sk_Ethan_01',        'Sk_Ethan_02',       'Sk_Ethan_03'],
    'Eva':           ['Sk_Eva_01',          'Sk_Eva_02',         'Sk_Eva_03'],
    'Gaheris':       ['Sk_Gaheris_01',      'Sk_Gaheris_02',     'Sk_Gaheris_03'],
    'Galahad':       ['Sk_Galahad_01',      'Sk_Galahad_02',     'Sk_Galahad_03'],
    'Gawain':        ['Sk_Gawain_01',       'Sk_Gawain_02',      'Sk_Gawain_03'],
    'Guinevere':     ['Sk_Guinevere_01',    'Sk_Guinevere_02',   'Sk_Guinevere_03'],
    'Hikage':        ['Sk_Hikage_01',       'Sk_Hikage_02',      'Sk_Hikage_03'],
    'Isabel':        ['Sk_Isabel_01',       'Sk_Isabel_02',      'Sk_Isabel_03'],
    'Isis':          ['Sk_Isis_01',         'Sk_Isis_02',        'Sk_Isis_03'],
    'Isolde':        ['Sk_Isolde_01',       'Sk_Isolde_02',      'Sk_Isolde_03'],
    'Jessi':         ['Sk_Jessi_01',        'Sk_Jessi_02',       'Sk_Jessi_03'],
    'Joan Of Arc':   ['Sk_Joanofarc_01',    'Sk_Joanofarc_02',   'Sk_Joanofarc_03'],
    'Karishara':     ['Sk_Karishara_01',    'Sk_Karishara_02',   'Sk_Karishara_03'],
    'Katrin':        ['Sk_Katrin_01',       'Sk_Katrin_02',      'Sk_Katrin_03'],
    'Kay':           ['Sk_Kay_01',          'Sk_Kay_02',         'Sk_Kay_03'],
    'Lancelot':      ['Sk_Lancelot_01',     'Sk_Lancelot_02',    'Sk_Lancelot_03'],
    'Lilith':        ['Sk_Lilith_01',       'Sk_Lilith_02',      'Sk_Lilith_03'],
    'Lisa':          ['Sk_Lisa_01',         'Sk_Lisa_02',        'Sk_Lisa_03'],
    'Lohengrin':     ['Sk_Lohengrin_01',    'Sk_Lohengrin_02',   'Sk_Lohengrin_03'],
    'Lua':           ['Sk_Lua_01',          'Sk_Lua_02',         'Sk_Lua_03'],
    'Lucy':          ['Sk_Lucy_01',         'Sk_Lucy_02',        'Sk_Lucy_03'],
    'Lueira':        ['Sk_Lueira_01',       'Sk_Lueira_02',      'Sk_Lueira_03'],
    'Merlin':        ['Sk_Merlin_01',       'Sk_Merlin_02',      'Sk_Merlin_03'],
    'Merry':         ['Sk_Merry_01',        'Sk_Merry_02',       'Sk_Merry_03'],
    'S. Merry':      ['Sk_SMerry_01',       'Sk_SMerry_02',      'Sk_SMerry_03'],
    'Mia':           ['Sk_Mia_01',          'Sk_Mia_02',         'Sk_Mia_03'],
    'Morgan Le Fay': ['Sk_MorganleFay_01',  'Sk_MorganleFay_02', 'Sk_MorganleFay_03'],
    'Morgana':       ['Sk_Morgana_01',      'Sk_Morgana_02',     'Sk_Morgana_03'],
    'Morgause':      ['Sk_Morgause_01',     'Sk_Morgause_02',    'Sk_Morgause_03'],
    'Nesha':         ['Sk_Nesha_01',        'Sk_Nesha_02',       'Sk_Nesha_03'],
    'Nimue':         ['Sk_Nimue_01',        'Sk_Nimue_02',       'Sk_Nimue_03'],
    'Palamedes':     ['Sk_Palamedes_01',    'Sk_Palamedes_02',   'Sk_Palamedes_03'],
    'Percival':      ['Sk_Percival_01',     'Sk_Percival_02',    'Sk_Percival_03'],
    'Rachel':        ['Sk_Rachel_01',       'Sk_Rachel_02',      'Sk_Rachel_03'],
    'Ran':           ['Sk_Ran_01',          'Sk_Ran_02',         'Sk_Ran_03'],
    'Ray':           ['Sk_Rey_01',          'Sk_Rey_02',         'Sk_Rey_03'],
    'Ria':           ['Sk_Ria_01',          'Sk_Ria_02',         'Sk_Ria_03'],
    'Rita':          ['Sk_Rita_01',         'Sk_Rita_02',        'Sk_Rita_03'],
    'Rita Maid':     ['Sk_MaidRita_01',     'Sk_MaidRita_02',    'Sk_MaidRita_03'],
    'Rowena':        ['Sk_Rowena_01',       'Sk_Rowena_02',      'Sk_Rowena_03'],
    'Sarah':         ['Sk_Sarah_01',        'Sk_Sarah_02',       'Sk_Sarah_03'],
    'Tiamat':        ['Sk_Tiamat_01',       'Sk_Tiamat_02',      'Sk_Tiamat_03'],
    'Tristan':       ['Sk_Tristan_01',      'Sk_Tristan_02',     'Sk_Tristan_03'],
    'Urien':         ['Sk_Urien_01',        'Sk_Urien_02',       'Sk_Urien_03'],
    'Vivien':        ['Sk_Vivien_01',       'Sk_Vivien_02',      'Sk_Vivien_03'],
    'Yumi':          ['Sk_Yumi_01',         'Sk_Yumi_02',        'Sk_Yumi_03'],
};

// Resolved cache: charName → string[] of confirmed-existing filenames.
// 'pending' while probe is in flight, [] if no skins found.
const _resolvedSkins = {};

// Probe a single image URL; resolve true if it loads, false if it 404s.
function _probeImage(url) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload  = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
    });
}

async function _probeSkins(charName) {
    if (_resolvedSkins[charName] !== undefined) return; // already probing/done
    _resolvedSkins[charName] = 'pending';
    const candidates = _skinCandidates[charName] || [];
    const confirmed = [];
    for (const stem of candidates) {
        const url = `Assets/lostsword/skins/${stem}.webp`;
        const ok = await _probeImage(url);
        if (ok) confirmed.push(stem);
        // Stop as soon as one is missing — skins are numbered sequentially,
        // so a gap means no further skins exist.
        else break;
    }
    _resolvedSkins[charName] = confirmed;
    // Re-render so the button/dots update now that we know the real count.
    // Guard: renderTeamGrid is defined later in index.html, so check before calling.
    if (typeof renderTeamGrid === 'function') renderTeamGrid();
}

// Return confirmed skins array for a character, or null if still unknown.
function getSkins(charName) {
    if (!charName || !_skinCandidates[charName]) return [];
    const cached = _resolvedSkins[charName];
    if (cached === undefined) {
        // Fire probe async; return empty for now (no button shown yet)
        _probeSkins(charName);
        return null; // null = "still loading"
    }
    if (cached === 'pending') return null;
    return cached; // [] or ['Sk_...', ...]
}

// Per-slot active skin index: 0 = base character image, 1+ = skin index in confirmed array
let slotSkinIndex = [0, 0, 0, 0, 0];

// Get the image src for a slot: base char or active skin
function getSlotCharImg(slotIndex) {
    const slot = slotData[slotIndex];
    if (!slot || !slot.character) return null;
    const skinIdx = slotSkinIndex[slotIndex];
    if (skinIdx > 0) {
        const skins = _resolvedSkins[slot.character];
        if (Array.isArray(skins) && skins[skinIdx - 1]) {
            return `Assets/lostsword/skins/${skins[skinIdx - 1]}.webp`;
        }
    }
    const charData = db.characters.find(c => c.name === slot.character);
    return charData ? charData.img : null;
}

// Cycle skin for a slot: base → skin1 → … → base
function cycleSkin(slotIndex, event) {
    event.stopPropagation();
    const slot = slotData[slotIndex];
    if (!slot || !slot.character) return;
    const skins = _resolvedSkins[slot.character];
    if (!Array.isArray(skins) || skins.length === 0) return;
    const total = skins.length + 1; // +1 for base
    slotSkinIndex[slotIndex] = (slotSkinIndex[slotIndex] + 1) % total;
    // Guard: renderTeamGrid is defined later in index.html, so check before calling.
    if (typeof renderTeamGrid === 'function') renderTeamGrid();
}
