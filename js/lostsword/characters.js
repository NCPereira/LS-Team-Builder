// ── characters.js ────────────────────────────────────────────────────────────
// Character data, database, name helpers, and lookup utilities.
// Loaded before teamgrid.js and any script that calls getCharInfo().
//
// TO ADD A CHARACTER:
//   1. Push a new object to CHARACTERS below (all data in one place).
//   2. If parseName() won't split the internal name correctly, add an
//      override to _parseNameOverrides below.
//   3. If users should find it via a short alias, add to searchAliases.

// ── Display name overrides (raw camelCase namePart → display name) ────────────
const _parseNameOverrides = {
    'Joanofarc':   'Joan Of Arc',
    'Morganlefay': 'Morgan Le Fay',
    'SMerry':      'S. Merry',
};

// ── Search aliases ────────────────────────────────────────────────────────────
const searchAliases = {
    'mlf':    'morgan le fay',
    'smerry': 's merry',
};

function resolveSearch(raw) {
    return raw ? (searchAliases[raw] || raw) : raw;
}

// ── Shared normalised lookup index (characters + pets share this map) ─────────
const _dbIndex = {};

function getCharInfo(displayName) {
    if (!displayName) return {};
    if (characterDatabase[displayName]) return characterDatabase[displayName];
    const stripped = displayName.replace(/\s+\d+$/, '').trim();
    if (characterDatabase[stripped]) return characterDatabase[stripped];
    const norm = stripped.replace(/[^a-z0-9]/gi, '').toLowerCase();
    const key  = _dbIndex[norm];
    if (key) return characterDatabase[key] || (typeof petDatabase !== 'undefined' && petDatabase[key]) || {};
    if (typeof petDatabase !== 'undefined') {
        if (petDatabase[displayName]) return petDatabase[displayName];
        if (petDatabase[stripped])    return petDatabase[stripped];
    }
    return {};
}

// ── Master character list ─────────────────────────────────────────────────────
// Each entry:
//   internalName : the 'Pc_Name_01' filename stem (drives image paths)
//   class        : Knight | Archer | Wizard | Healer
//   element      : Fire | Frost | Nature | Holy | Shock | Chaos | Radiance
//   position     : Front | Middle | Back
//   rarity       : '3' | '4' | '5'
//
// TO ADD A CHARACTER: push one object here. That's it.

const CHARACTERS = [
//  internalName              class       element      position   rarity
    { internalName: 'Pc_Agravaine_01',   class: 'Archer',  element: 'Chaos',    position: 'Middle', rarity: '5' },
    { internalName: 'Pc_Anessa_01',      class: 'Knight',  element: 'Frost',    position: 'Front',  rarity: '5' },
    { internalName: 'Pc_Asuka_01',       class: 'Knight',  element: 'Nature',   position: 'Front',  rarity: '5' },
    { internalName: 'Pc_Balin_01',       class: 'Knight',  element: 'Nature',   position: 'Front',  rarity: '4' },
    { internalName: 'Pc_Bedivere_01',    class: 'Archer',  element: 'Nature',   position: 'Back',   rarity: '4' },
    { internalName: 'Pc_NeoBedivere_01', class: 'Archer',  element: 'Holy',     position: 'Middle', rarity: '5' },
    { internalName: 'Pc_Claire_01',      class: 'Knight',  element: 'Radiance', position: 'Middle', rarity: '5' },
    { internalName: 'Pc_Belsey_01',      class: 'Knight',  element: 'Fire',     position: 'Front',  rarity: '5' },
    { internalName: 'Pc_Cristina_01',    class: 'Wizard',  element: 'Fire',     position: 'Middle', rarity: '5' },
    { internalName: 'Pc_DianCecht_01',   class: 'Healer',  element: 'Radiance', position: 'Middle', rarity: '5' },
    { internalName: 'Pc_Elaine_01',      class: 'Wizard',  element: 'Frost',    position: 'Middle', rarity: '3' },
    { internalName: 'Pc_Elin_01',        class: 'Archer',  element: 'Nature',   position: 'Middle', rarity: '4' },
    { internalName: 'Pc_Elizabeth_01',   class: 'Knight',  element: 'Fire',     position: 'Front',  rarity: '5' },
    { internalName: 'Pc_Enya_01',        class: 'Archer',  element: 'Fire',     position: 'Back',   rarity: '5' },
    { internalName: 'Pc_Erin_01',        class: 'Wizard',  element: 'Radiance', position: 'Back',   rarity: '5' },
    { internalName: 'Pc_Esmeralda_01',   class: 'Healer',  element: 'Radiance', position: 'Back',   rarity: '4' },
    { internalName: 'Pc_Estheria_01',    class: 'Wizard',  element: 'Chaos',    position: 'Back',   rarity: '5' },
    { internalName: 'Pc_Ethan_01',       class: 'Knight',  element: 'Frost',    position: 'Front',  rarity: '4' },
    { internalName: 'Pc_Eva_01',         class: 'Wizard',  element: 'Shock',    position: 'Back',   rarity: '5' },
    { internalName: 'Pc_Gaheris_01',     class: 'Knight',  element: 'Fire',     position: 'Front',  rarity: '4' },
    { internalName: 'Pc_Galahad_01',     class: 'Knight',  element: 'Radiance', position: 'Front',  rarity: '5' },
    { internalName: 'Pc_Gawain_01',      class: 'Knight',  element: 'Nature',   position: 'Front',  rarity: '5' },
    { internalName: 'Pc_Guinevere_01',   class: 'Healer',  element: 'Frost',    position: 'Back',   rarity: '5' },
    { internalName: 'Pc_Hikage_01',      class: 'Archer',  element: 'Nature',   position: 'Middle', rarity: '5' },
    { internalName: 'Pc_Isabel_01',      class: 'Archer',  element: 'Frost',    position: 'Front',  rarity: '5' },
    { internalName: 'Pc_Isis_01',        class: 'Knight',  element: 'Radiance', position: 'Front',  rarity: '3' },
    { internalName: 'Pc_Isolde_01',      class: 'Healer',  element: 'Nature',   position: 'Back',   rarity: '5' },
    { internalName: 'Pc_Joanofarc_01',   class: 'Archer',  element: 'Shock',    position: 'Back',   rarity: '5' },
    { internalName: 'Pc_Jessi_01',       class: 'Archer',  element: 'Chaos',    position: 'Back',   rarity: '3' },
    { internalName: 'Pc_Karishara_01',   class: 'Wizard',  element: 'Fire',     position: 'Back',   rarity: '5' },
    { internalName: 'Pc_Katrin_01',      class: 'Wizard',  element: 'Frost',    position: 'Back',   rarity: '5' },
    { internalName: 'Pc_Kay_01',         class: 'Knight',  element: 'Fire',     position: 'Front',  rarity: '5' },
    { internalName: 'Pc_Circe_01',       class: 'Wizard',  element: 'Chaos',    position: 'Back',   rarity: '5' },
    { internalName: 'Pc_Lancelot_01',    class: 'Knight',  element: 'Radiance', position: 'Front',  rarity: '5' },
    { internalName: 'Pc_Lilith_01',      class: 'Knight',  element: 'Chaos',    position: 'Middle', rarity: '5' },
    { internalName: 'Pc_Lisa_01',        class: 'Archer',  element: 'Chaos',    position: 'Middle', rarity: '5' },
    { internalName: 'Pc_Lohengrin_01',   class: 'Knight',  element: 'Chaos',    position: 'Back',   rarity: '5' },
    { internalName: 'Pc_Lua_01',         class: 'Knight',  element: 'Shock',    position: 'Front',  rarity: '5' },
    { internalName: 'Pc_Lucy_01',        class: 'Knight',  element: 'Chaos',    position: 'Front',  rarity: '5' },
    { internalName: 'Pc_Lueira_01',      class: 'Healer',  element: 'Frost',    position: 'Back',   rarity: '5' },
    { internalName: 'Pc_Rowena_01',      class: 'Wizard',  element: 'Chaos',    position: 'Back',   rarity: '4' },
    { internalName: 'Pc_Merlin_01',      class: 'Wizard',  element: 'Holy',     position: 'Middle', rarity: '5' },
    { internalName: 'Pc_Merry_01',       class: 'Wizard',  element: 'Nature',   position: 'Back',   rarity: '4' },
    { internalName: 'Pc_SMerry_01',      class: 'Wizard',  element: 'Frost',    position: 'Back',   rarity: '5' },
    { internalName: 'Pc_Mia_01',         class: 'Knight',  element: 'Shock',    position: 'Front',  rarity: '5' },
    { internalName: 'Pc_Morgana_01',     class: 'Wizard',  element: 'Chaos',    position: 'Back',   rarity: '5' },
    { internalName: 'Pc_Morganlefay_01', class: 'Wizard',  element: 'Holy',     position: 'Middle', rarity: '5' },
    { internalName: 'Pc_Morgause_01',    class: 'Wizard',  element: 'Fire',     position: 'Back',   rarity: '5' },
    { internalName: 'Pc_Nesha_01',       class: 'Archer',  element: 'Radiance', position: 'Back',   rarity: '5' },
    { internalName: 'Pc_Nimue_01',       class: 'Wizard',  element: 'Frost',    position: 'Middle', rarity: '4' },
    { internalName: 'Pc_Palamedes_01',   class: 'Knight',  element: 'Nature',   position: 'Front',  rarity: '5' },
    { internalName: 'Pc_Percival_01',    class: 'Knight',  element: 'Frost',    position: 'Front',  rarity: '5' },
    { internalName: 'Pc_Rachel_01',      class: 'Healer',  element: 'Nature',   position: 'Middle', rarity: '3' },
    { internalName: 'Pc_Ran_01',         class: 'Knight',  element: 'Holy',     position: 'Front',  rarity: '5' },
    { internalName: 'Pc_Ray_01',         class: 'Knight',  element: 'Chaos',    position: 'Front',  rarity: '4' },
    { internalName: 'Pc_Ria_01',         class: 'Healer',  element: 'Fire',     position: 'Back',   rarity: '5' },
    { internalName: 'Pc_Rita_01',        class: 'Knight',  element: 'Fire',     position: 'Front',  rarity: '3' },
    { internalName: 'Pc_MaidRita_01',    class: 'Healer',  element: 'Fire',     position: 'Middle', rarity: '5' },
    { internalName: 'Pc_Sarah_01',       class: 'Archer',  element: 'Fire',     position: 'Middle', rarity: '4' },
    { internalName: 'Pc_Tiamat_01',      class: 'Wizard',  element: 'Holy',     position: 'Back',   rarity: '5' },
    { internalName: 'Pc_Tristan_01',     class: 'Archer',  element: 'Nature',   position: 'Back',   rarity: '5' },
    { internalName: 'Pc_Urien_01',       class: 'Knight',  element: 'Radiance', position: 'Front',  rarity: '4' },
    { internalName: 'Pc_Vivien_01',      class: 'Wizard',  element: 'Nature',   position: 'Middle', rarity: '5' },
    { internalName: 'Pc_Yumi_01',        class: 'Wizard',  element: 'Frost',    position: 'Back',   rarity: '5' },
    { internalName: 'Pc_Lumi_01',        class: 'Knight',  element: 'Shock',    position: 'Front',  rarity: '5' },
];

// ── Compatibility shims ───────────────────────────────────────────────────────
// teamgrid.js reads rawCharacters and characterDatabase — these are derived
// from the unified CHARACTERS array above so nothing else needs to change.

// parseName: converts 'Pc_InternalName_01' → display name
function parseName(filename) {
    const parts    = filename.split('_');
    const namePart = parts[1] || parts[0];
    const num      = parts.length > 2 ? parseInt(parts[2], 10) : 1;
    const numStr   = num > 1 ? ` ${num}` : '';
    if (_parseNameOverrides[namePart]) return _parseNameOverrides[namePart] + numStr;
    return namePart.replace(/([A-Z])/g, ' $1').trim() + numStr;
}

// rawCharacters: string array of 'Pc_Name_01' values (what teamgrid.js maps over)
const rawCharacters = CHARACTERS.map(c => c.internalName);

// characterDatabase: display-name → { class, element, position, rarity }
const characterDatabase = Object.fromEntries(
    CHARACTERS.map(c => {
        const displayName = parseName(c.internalName);
        return [displayName, {
            class:    c.class,
            element:  c.element,
            position: c.position,
            rarity:   c.rarity,
        }];
    })
);

// Populate normalised lookup index for characters.
// petDatabase is indexed at the bottom of pets.js after it loads.
Object.keys(characterDatabase).forEach(k => {
    _dbIndex[k.replace(/[^a-z0-9]/gi, '').toLowerCase()] = k;
});