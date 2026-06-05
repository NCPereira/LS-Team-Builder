// ── characters.js ────────────────────────────────────────────────────────────
// All character data, database, name helpers, and lookup utilities.
// Loaded before index.html scripts that depend on these globals.

// ── Display name overrides applied inside parseName (raw namePart → display name) ──
// Needed for filenames whose camelCase doesn't auto-split correctly,
// e.g. "Joanofarc" → "Joan Of Arc",  "Morganlefay" → "Morgan Le Fay"
const _parseNameOverrides = {
    'Joanofarc':   'Joan Of Arc',
    'Morganlefay': 'Morgan Le Fay',
    'Morganlefay': 'Morgan Le Fay',
    'SMerry':      'S. Merry',
};

// ── Search aliases: typed shorthand → substring to match against display names (lowercase) ──
const searchAliases = {
    'mlf':    'morgan le fay',
    'smerry': 's merry',
};

// Resolve a raw search term against aliases (exact match only).
// Falls through to normal substring search if no alias matches.
function resolveSearch(raw) {
    if (!raw) return raw;
    return searchAliases[raw] || raw;
}

// Pre-built normalised (no-space, lowercase) index — populated after characterDatabase
const _dbIndex = {};

function getCharInfo(displayName) {
    if (!displayName) return {};
    // 1. Direct lookup
    if (characterDatabase[displayName]) return characterDatabase[displayName];
    // 2. Strip trailing variant number ("Bedivere 2" → "Bedivere")
    const stripped = displayName.replace(/\s+\d+$/, '').trim();
    if (characterDatabase[stripped]) return characterDatabase[stripped];
    // 3. Case-insensitive no-space match ("Morgan Le Fay" → "MorganLeFay")
    const norm = stripped.replace(/\s+/g, '').toLowerCase();
    const key = _dbIndex[norm];
    if (key) return characterDatabase[key];
    return {};
}

// ── Raw character filenames (used to build db.characters) ──
const rawCharacters = [
    'Pc_Agravaine_01', 'Pc_Anessa_01','Pc_Asuka_01', 'Pc_Balin_01',
    'Pc_Bedivere_01', 'Pc_NeoBedivere_01','Pc_Claire_01', 'Pc_Belsey_01',
    'Pc_Cristina_01', 'Pc_DianCecht_01','Pc_Elaine_01', 'Pc_Elin_01',
    'Pc_Elizabeth_01', 'Pc_Enya_01','Pc_Erin_01', 'Pc_Esmeralda_01',
    'Pc_Estheria_01', 'Pc_Ethan_01','Pc_Eva_01', 'Pc_Gaheris_01',
    'Pc_Galahad_01', 'Pc_Gawain_01','Pc_Guinevere_01', 'Pc_Hikage_01',
    'Pc_Isabel_01', 'Pc_Isis_01','Pc_Isolde_01', 'Pc_Joanofarc_01',
    'Pc_Jessi_01', 'Pc_Karishara_01','Pc_Katrin_01', 'Pc_Kay_01',
    'Pc_Circe_01', 'Pc_Lancelot_01','Pc_Lilith_01', 'Pc_Lisa_01',
    'Pc_Lohengrin_01', 'Pc_Lua_01','Pc_Lucy_01', 'Pc_Lueira_01',
    'Pc_Rowena_01', 'Pc_Merlin_01','Pc_Merry_01', 'Pc_SMerry_01',
    'Pc_Mia_01', 'Pc_Morgana_01','Pc_Morganlefay_01', 'Pc_Morgause_01',
    'Pc_Nesha_01', 'Pc_Nimue_01','Pc_Palamedes_01', 'Pc_Percival_01',
    'Pc_Rachel_01', 'Pc_Ran_01','Pc_Ray_01', 'Pc_Ria_01',
    'Pc_Rita_01', 'Pc_MaidRita_01','Pc_Sarah_01', 'Pc_Tiamat_01',
    'Pc_Tristan_01', 'Pc_Urien_01','Pc_Vivien_01', 'Pc_Yumi_01',
    'Pc_Lumi_01',
];

// ── Character database with class, element, position, and rarity ──
const characterDatabase = {
    'Agravaine':     { class: 'Archer',  element: 'Chaos',    position: 'Middle', rarity: '5' },
    'Anessa':        { class: 'Knight',  element: 'Frost',    position: 'Front',  rarity: '5' },
    'Asuka':         { class: 'Knight',  element: 'Nature',   position: 'Front',  rarity: '5' },
    'Balin':         { class: 'Knight',  element: 'Nature',   position: 'Front',  rarity: '4' },
    'Bedivere':      { class: 'Archer',  element: 'Nature',   position: 'Back',   rarity: '4' },
    'NeoBedivere':   { class: 'Archer',  element: 'Holy',     position: 'Middle', rarity: '5' },
    'Circe':         { class: 'Wizard',  element: 'Nature',   position: 'Back',   rarity: '5' },
    'Claire':        { class: 'Knight',  element: 'Radiance', position: 'Middle', rarity: '5' },
    'Belsey':        { class: 'Knight',  element: 'Fire',    position: 'Front',   rarity: '5' },
    'Cristina':      { class: 'Wizard',  element: 'Fire',     position: 'Middle', rarity: '5' },
    'DianCecht':     { class: 'Healer',  element: 'Radiance', position: 'Middle', rarity: '5' },
    'Elaine':        { class: 'Wizard',  element: 'Frost',    position: 'Middle', rarity: '3' },
    'Elin':          { class: 'Archer',  element: 'Nature',   position: 'Middle', rarity: '4' },
    'Elizabeth':     { class: 'Knight',  element: 'Fire',     position: 'Front',  rarity: '5' },
    'Enya':          { class: 'Archer',  element: 'Fire',     position: 'Back',   rarity: '5' },
    'Erin':          { class: 'Wizard',  element: 'Radiance', position: 'Back',   rarity: '5' },
    'Esmeralda':     { class: 'Healer',  element: 'Radiance', position: 'Back',   rarity: '4' },
    'Estheria':      { class: 'Wizard',  element: 'Chaos',    position: 'Back',   rarity: '5' },
    'Ethan':         { class: 'Knight',  element: 'Frost',    position: 'Front',  rarity: '4' },
    'Eva':           { class: 'Wizard',  element: 'Shock',    position: 'Back',   rarity: '5' },
    'Gaheris':       { class: 'Knight',  element: 'Fire',     position: 'Front',  rarity: '4' },
    'Galahad':       { class: 'Knight',  element: 'Radiance', position: 'Front',  rarity: '5' },
    'Gawain':        { class: 'Knight',  element: 'Nature',   position: 'Front',  rarity: '5' },
    'Guinevere':     { class: 'Healer',  element: 'Frost',    position: 'Back',   rarity: '5' },
    'Hikage':        { class: 'Archer',  element: 'Nature',   position: 'Middle', rarity: '5' },
    'Isabel':        { class: 'Archer',  element: 'Frost',    position: 'Front',  rarity: '5' },
    'Isis':          { class: 'Knight',  element: 'Radiance', position: 'Front',  rarity: '3' },
    'Isolde':        { class: 'Healer',  element: 'Nature',   position: 'Back',   rarity: '5' },
    'Jessi':         { class: 'Archer',  element: 'Chaos',    position: 'Back',   rarity: '3' },
    'Joanofarc':     { class: 'Archer',  element: 'Shock',    position: 'Back',   rarity: '5' },
    'Karishara':     { class: 'Wizard',  element: 'Fire',     position: 'Back',   rarity: '5' },
    'Katrin':        { class: 'Wizard',  element: 'Frost',    position: 'Back',   rarity: '5' },
    'Kay':           { class: 'Knight',  element: 'Fire',     position: 'Front',  rarity: '5' },
    'Lancelot':      { class: 'Knight',  element: 'Radiance', position: 'Front',  rarity: '5' },
    'Lilith':        { class: 'Knight',  element: 'Chaos',    position: 'Middle', rarity: '5' },
    'Lisa':          { class: 'Archer',  element: 'Chaos',    position: 'Middle', rarity: '5' },
    'Lohengrin':     { class: 'Knight',  element: 'Chaos',    position: 'Back',   rarity: '5' },
    'Lua':           { class: 'Knight',  element: 'Shock',    position: 'Front',  rarity: '5' },
    'Lucy':          { class: 'Knight',  element: 'Chaos',    position: 'Front',  rarity: '5' },
    'Lueira':        { class: 'Healer',  element: 'Frost',    position: 'Back',   rarity: '5' },
    'Merlin':        { class: 'Wizard',  element: 'Holy',     position: 'Middle', rarity: '5' },
    'Merry':         { class: 'Wizard',  element: 'Nature',   position: 'Back',   rarity: '4' },
    'SMerry':        { class: 'Wizard',  element: 'Frost',    position: 'Back',   rarity: '5' },
    'Mia':           { class: 'Knight',  element: 'Shock',    position: 'Front',  rarity: '5' },
    'MorganLeFay':   { class: 'Wizard',  element: 'Holy',     position: 'Middle', rarity: '5' },
    'Morgana':       { class: 'Wizard',  element: 'Chaos',    position: 'Back',   rarity: '5' },
    'Morgause':      { class: 'Wizard',  element: 'Fire',     position: 'Back',   rarity: '5' },
    'Nesha':         { class: 'Archer',  element: 'Radiance', position: 'Back',   rarity: '5' },
    'Nimue':         { class: 'Wizard',  element: 'Frost',    position: 'Middle', rarity: '4' },
    'Palamedes':     { class: 'Knight',  element: 'Nature',   position: 'Front',  rarity: '5' },
    'Percival':      { class: 'Knight',  element: 'Frost',    position: 'Front',  rarity: '5' },
    'Rachel':        { class: 'Healer',  element: 'Nature',   position: 'Middle', rarity: '3' },
    'Ran':           { class: 'Knight',  element: 'Holy',     position: 'Front',  rarity: '5' },
    'Ray':           { class: 'Knight',  element: 'Chaos',    position: 'Front',  rarity: '4' },
    'Ria':           { class: 'Healer',  element: 'Fire',     position: 'Back',   rarity: '5' },
    'Rita':          { class: 'Knight',  element: 'Fire',     position: 'Front',  rarity: '3' },
    'MaidRita':      { class: 'Healer',  element: 'Fire',     position: 'Middle', rarity: '5' },
    'Rowena':        { class: 'Wizard',  element: 'Chaos',    position: 'Back',   rarity: '4' },
    'Sarah':         { class: 'Archer',  element: 'Fire',     position: 'Middle', rarity: '4' },
    'Tiamat':        { class: 'Wizard',  element: 'Holy',     position: 'Back',   rarity: '5' },
    'Tristan':       { class: 'Archer',  element: 'Nature',   position: 'Back',   rarity: '5' },
    'Urien':         { class: 'Knight',  element: 'Radiance', position: 'Front',  rarity: '4' },
    'Vivien':        { class: 'Wizard',  element: 'Nature',   position: 'Middle', rarity: '5' },
    'Yumi':          { class: 'Wizard',  element: 'Frost',    position: 'Back',   rarity: '5' },
    'Lumi':          { class: 'Knight',  element: 'Shock',    position: 'Front',   rarity: '5' },

    // ── Pet-only entries ───────────────────────────────────────────────────────
    'Whitey':       { element: 'Radiance', rarity: '4' },
    'Gold':         { element: 'Fire',     rarity: '3' },
    'Neo':          { element: 'Frost',    rarity: '4' },
    'Nightsong':    { element: 'Chaos',    rarity: '4' },
    'Shiba':        { element: 'Fire',     rarity: '4' },
    'Belle':        { element: 'Nature',   rarity: '4' },
    'Slime':        { element: 'Nature',   rarity: '3' },
    'Retriever':    { element: 'Radiance', rarity: '3' },
    'Raccoon':      { element: 'Shock',    rarity: '3' },
    'Hen':          { element: 'Shock',    rarity: '3' },
    'Chick':        { element: 'Fire',     rarity: '3' },
    'Momo':         { element: 'Nature',   rarity: '3' },
    'Nabi':         { element: 'Chaos',    rarity: '3' },
    'Cheese':       { element: 'Holy',     rarity: '3' },
    'Phoenix':      { element: 'Fire',     rarity: '5' },
    'Coco':         { element: 'Frost',    rarity: '3' },
    'Midnight':     { element: 'Shock',    rarity: '4' },
    'Fenrir':       { element: 'Shock',    rarity: '5' },
    'Griffon':      { element: 'Nature',   rarity: '5' },
    'Athena':       { element: 'Radiance', rarity: '5' },
    'UnleashedEva': { element: 'Shock',    rarity: '5' },
};

// Populate normalised lookup index now that characterDatabase is defined
Object.keys(characterDatabase).forEach(k => {
    _dbIndex[k.replace(/\s+/g, '').toLowerCase()] = k;
});
