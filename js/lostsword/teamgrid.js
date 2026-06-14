// ── teamgrid.js ───────────────────────────────────────────────────────────────
// Team grid state, rendering, modal logic, filters, auto-gear, multi-select,
// stat presets, and formation helpers.
// Depends on: characters.js, equipment.js, skins.js, pets.js, rotation.js,
//             battlestats.js (for bstatDealt / renderBStatBars)

// ── State ─────────────────────────────────────────────────────────────────────

function _emptySlot() {
    return { character: null, gear: { Weapon: null, Armor: null, Helmet: null, Rune: null }, card: null, statPriority: { Weapon: [], Armor: [], Helmet: [], Rune: [] } };
}

let slotData = [_emptySlot(), _emptySlot(), _emptySlot(), _emptySlot(), _emptySlot()];

// Formation mapping: form-slot-idx → team slot index (or -1 for empty)
let formationSlots = [1, 3, 4, 0, 2, -1];

const categories = ['Weapon', 'Armor', 'Helmet', 'Rune'];

// ── Name parsing ──────────────────────────────────────────────────────────────

function parseName(filename) {
    let parts = filename.split('_');
    let namePart = parts[1] || parts[0];
    let num = parts.length > 2 ? parseInt(parts[2], 10) : 1;
    let numStr = num > 1 ? ` ${num}` : '';
    if (_parseNameOverrides[namePart]) return _parseNameOverrides[namePart] + numStr;
    namePart = namePart.replace(/([A-Z])/g, ' $1').trim();
    return namePart + numStr;
}

// ── Item database ─────────────────────────────────────────────────────────────

const db = {
    characters: rawCharacters.map(f => ({ name: parseName(f), img: `Assets/lostsword/rawCharacters/${f}.webp` })),
    cards:      rawCards.map(f => {
        const key   = f.replace(/^Card_/, '').replace(/_\d+$/, '');
        const info  = (typeof cardNames !== 'undefined' && cardNames[key]) || null;
        return {
            name:     parseName(f),
            cardName: info ? info.cardName : parseName(f),
            charName: info ? info.charName : parseName(f),
            img:      `Assets/lostsword/rawCards/${f}.webp`,
        };
    }),
    pets:       rawPets.map(f => ({ name: parseName(f), img: `Assets/lostsword/rawPets/${f}.webp` })),
    gems:       rawGems.map(name => ({ name, img: `Assets/lostsword/gems/${name}.webp`, element: gemElements[name] })),
    Weapon: rawWeapons.map(name => ({ name, img: `Assets/lostsword/weapons/${weaponFilenames[name]}.webp`, class: weaponClasses[name]?.class, classes: weaponClasses[name]?.classes, excludeClass: weaponClasses[name]?.excludeClass, unique: weaponClasses[name]?.unique || false })),
    Armor:  rawArmor.map(name =>   ({ name, img: `Assets/lostsword/armor/${armorFilenames[name] || name.toLowerCase().replace(/[^\w\s]/g,'').replace(/\s+/g,'-')}.webp`,   class: armorClasses[name]?.class,   excludeClass: armorClasses[name]?.excludeClass,   unique: armorClasses[name]?.unique   || false })),
    Helmet: rawHelmets.map(name =>  ({ name, img: `Assets/lostsword/helmets/${helmetFilenames[name] || name.toLowerCase().replace(/[^\w\s]/g,'').replace(/\s+/g,'-')}.webp`, class: helmetClasses[name]?.class,  excludeClass: helmetClasses[name]?.excludeClass,  unique: helmetClasses[name]?.unique  || false })),
    Rune:   rawRunes.map(name =>    ({ name, img: `Assets/lostsword/runes/${runeFilenames[name]   || name.toLowerCase().replace(/[^\w\s]/g,'').replace(/\s+/g,'-')}.webp`,   class: runeClasses[name]?.class,    excludeClass: runeClasses[name]?.excludeClass,    unique: runeClasses[name]?.unique    || false })),
};

// ── Modal state ───────────────────────────────────────────────────────────────

let currentActiveSection  = null;
let currentActiveCategory = null;
let currentGearCategory   = null;

// ── Filter state ──────────────────────────────────────────────────────────────

const activeFilters = { rarity: new Set(), position: new Set(), class: new Set(), element: new Set() };

const positionMap = { 'Front': 'Forward', 'Middle': 'Center', 'Back': 'Backward' };

function toggleAllFilter(cat) {
    const allValues = {
        rarity:   ['3','4','5'],
        position: ['Forward','Center','Backward'],
        class:    ['Knight','Archer','Wizard','Healer'],
        element:  ['Fire','Frost','Nature','Holy','Shock','Chaos','Radiance']
    };
    allValues[cat].forEach(val => {
        activeFilters[cat].delete(val);
        const btn = document.getElementById(`fbtn-${cat}-${val}`);
        btn && btn.classList.remove('active');
    });
    const allBtn = document.getElementById(`fbtn-${cat}-all`);
    allBtn && allBtn.classList.add('active');
    applyCharacterFilters();
}

function toggleFilter(cat, val) {
    const btn    = document.getElementById(`fbtn-${cat}-${val}`);
    const allBtn = document.getElementById(`fbtn-${cat}-all`);
    if (activeFilters[cat].has(val)) {
        activeFilters[cat].delete(val);
        btn && btn.classList.remove('active');
        if (activeFilters[cat].size === 0) allBtn && allBtn.classList.add('active');
    } else {
        activeFilters[cat].add(val);
        btn && btn.classList.add('active');
        allBtn && allBtn.classList.remove('active');
    }
    applyCharacterFilters();
}

function resetFilters() {
    ['rarity','position','class','element'].forEach(cat => {
        activeFilters[cat].forEach(val => {
            const btn = document.getElementById(`fbtn-${cat}-${val}`);
            btn && btn.classList.remove('active');
        });
        activeFilters[cat].clear();
        const allBtn = document.getElementById(`fbtn-${cat}-all`);
        allBtn && allBtn.classList.add('active');
    });
    document.getElementById('modal-search').value = '';
    applyCharacterFilters();
}

function applyCharacterFilters() {
    const rawSearch = (document.getElementById('modal-search').value || '').toLowerCase();
    const search    = resolveSearch(rawSearch);
    const chars     = db.characters;
    const filtered  = chars.filter(item => {
        const info      = getCharInfo(item.name);
        const mappedPos = positionMap[info.position] || info.position || '';
        if (search && !item.name.toLowerCase().includes(search))          return false;
        if (activeFilters.rarity.size   && !activeFilters.rarity.has(info.rarity || ''))   return false;
        if (activeFilters.position.size && !activeFilters.position.has(mappedPos))          return false;
        if (activeFilters.class.size    && !activeFilters.class.has(info.class || ''))      return false;
        if (activeFilters.element.size  && !activeFilters.element.has(info.element || ''))  return false;
        return true;
    });
    renderModalGrid(filtered, true);
    const countEl = document.getElementById('char-showing-count');
    if (countEl) countEl.textContent = `Showing ${filtered.length} of ${chars.length} Characters`;
}

// ── Gear batch mode ───────────────────────────────────────────────────────────

let gearBatchMode = false;

function toggleGearBatch() {
    gearBatchMode = !gearBatchMode;
    const btn  = document.getElementById('gear-batch-btn');
    const hint = document.getElementById('gear-batch-hint');
    if (gearBatchMode) {
        btn.classList.add('active');
        btn.querySelector('i').style.color = '#4b6bfb';
        btn.querySelector('span').style.color = '#e2e8f0';
        if (hint) hint.classList.remove('hidden');
    } else {
        btn.classList.remove('active');
        btn.querySelector('i').style.color = '';
        btn.querySelector('span').style.color = '';
        if (hint) hint.classList.add('hidden');
    }
}

// ── Multi-select ──────────────────────────────────────────────────────────────

let multiSelectMode = false;
let multiSelectedItems = new Set();

// ── Ult sequence mode ─────────────────────────────────────────────────────────
// Tracks state while the modal is open for building the ultimate rotation.
// _ultSeqEnabled:  user-toggled preference (persists across modal opens)
// _ultSeqActive:   true while the modal is open in sequence mode
// _ultSeqStartIdx: which rotation slot was clicked to open the modal
// _ultSeqQueue:    array of character names selected so far this session
let _ultSeqEnabled  = false; // off by default — toggled by the user
let _ultSeqActive   = false;
let _ultSeqStartIdx = 0;
let _ultSeqQueue    = [];

function toggleMultiSelect() {
    multiSelectMode = !multiSelectMode;
    if (!multiSelectMode) multiSelectedItems.clear();
    updateMultiSelectBtn();
    filterGrid();
}

function updateMultiSelectBtn() {
    const btn = document.getElementById('multi-select-toggle-btn');
    if (!btn) return;
    const count    = multiSelectedItems.size;
    const maxSlots = currentActiveCategory === 'pet' ? 3 : 5;
    if (multiSelectMode) {
        btn.classList.add('active');
        btn.innerHTML = `<i class="fa-solid fa-check-square"></i> Multi (${count}/${maxSlots})`;
    } else {
        btn.classList.remove('active');
        btn.innerHTML = `<i class="fa-regular fa-square-check"></i> Multi-Select`;
    }
    const applyBtn = document.getElementById('multi-select-apply-btn');
    if (applyBtn) applyBtn.classList.toggle('hidden', !multiSelectMode || count === 0);
}

function applyMultiSelection() {
    if (!multiSelectMode || multiSelectedItems.size === 0) return;
    const type  = currentActiveCategory;
    const items = [...multiSelectedItems];

    if (type === 'character') {
        const prevChars = slotData.map(s => s.character);
        let targetSlots = slotData.map((s, i) => i).filter(i => !slotData[i].character);
        if (targetSlots.length === 0) targetSlots = [0,1,2,3,4];
        items.forEach((name, idx) => {
            if (idx >= targetSlots.length) return;
            const slotIdx = targetSlots[idx];
            slotData.forEach((s, i) => { if (i !== slotIdx && s.character === name) s.character = null; });
            slotData[slotIdx].character = name;
        });
        const newChars = new Set(slotData.map(s => s.character).filter(Boolean));
        prevChars.forEach(old => {
            if (old && !newChars.has(old)) {
                ultimateRotation.forEach(slot => {
                    if (slot.character === old) { slot.character = null; slot.time = ''; }
                });
            }
        });
        renderUltimateRotation();
    } else if (type === 'card') {
        let targetSlots = slotData.map((s, i) => i).filter(i => !slotData[i].card);
        if (targetSlots.length === 0) targetSlots = [0,1,2,3,4];
        items.forEach((name, idx) => {
            if (idx >= targetSlots.length) return;
            slotData[targetSlots[idx]].card = name;
        });
    } else if (type === 'pet') {
        items.forEach((name, idx) => {
            if (idx >= 3) return;
            petsData[idx].name = name;
            petsData[idx].gems = [null, null, null, null];
            petsData[idx].gemStat = null;
        });
    }

    multiSelectMode = false;
    multiSelectedItems.clear();
    renderTeamGrid();
    if (typeof bstatDealt !== 'undefined' && bstatDealt) renderBStatBars();
    closeModal();
}

// ── Auto-gear ─────────────────────────────────────────────────────────────────

let autoGearMode = 'none';

const autoGearPresets = {
    Knight: {
        offensive: { Weapon: 'Fragarach',           Armor: 'Wild Combat Suit',    Helmet: 'Fire Dragon\'s Helmet', Rune: 'Rune Of Focus'   },
        defensive: { Weapon: 'Fragarach',           Armor: 'Merlin\'s Robe',      Helmet: 'Fire Dragon\'s Helmet', Rune: 'Rune Of Focus'   },
    },
    Archer: {
        offensive: { Weapon: 'Sagittarius',         Armor: 'Wild Combat Suit',    Helmet: 'Fire Dragon\'s Helmet', Rune: 'Rune Of Focus'   },
        defensive: { Weapon: 'Sagittarius',         Armor: 'Merlin\'s Robe',      Helmet: 'Fire Dragon\'s Helmet', Rune: 'Rune Of Focus'   },
    },
    Wizard: {
        offensive: { Weapon: 'Thunderclap',         Armor: 'Wild Combat Suit',    Helmet: 'Fire Dragon\'s Helmet', Rune: 'Rune Of Focus'   },
        defensive: { Weapon: 'Thunderclap',         Armor: 'Merlin\'s Robe',      Helmet: 'Fire Dragon\'s Helm',   Rune: 'Rune Of Focus'   },
    },
    Healer: {
        offensive: { Weapon: 'Fire Dragon\'s Banner', Armor: 'Wild Combat Suit',  Helmet: 'Fire Dragon\'s Helmet', Rune: 'Rune Of Healing' },
        defensive: { Weapon: 'Aquarius',            Armor: 'Merlin\'s Robe',      Helmet: 'Fire Dragon\'s Helmet', Rune: 'Rune Of Healing' },
    },
};

function applyAutoGear(mode) {
    if (mode === 'none') return;
    slotData.forEach((slot, idx) => {
        if (!slot.character) return;
        const info   = getCharInfo(slot.character);
        const cls    = info.class;
        if (!cls || !autoGearPresets[cls]) return;
        const preset = autoGearPresets[cls][mode];
        if (!preset) return;
        Object.keys(preset).forEach(cat => {
            const gearName  = preset[cat];
            if (!gearName) return;
            const gearEntry = (db[cat] || []).find(g => g.name === gearName);
            if (!gearEntry) return;
            if (gearEntry.class && gearEntry.class !== cls) return;
            if (gearEntry.classes && !gearEntry.classes.includes(cls)) return;
            if (gearEntry.excludeClass && gearEntry.excludeClass === cls) return;
            if (gearEntry.unique) {
                const alreadyUsed = slotData.some((s, i) => i < idx && s.gear[cat] === gearName);
                if (alreadyUsed) return;
            }
            slot.gear[cat] = gearName;
        });
    });
    renderTeamGrid();
}

function toggleAutoGear(mode) {
    if (autoGearMode === mode) {
        autoGearMode = 'none';
    } else {
        autoGearMode = mode;
        applyAutoGear(mode);
    }
    updateAutoGearButtons();
    closeModal();
}

function updateAutoGearButtons() {
    const offBtn = document.getElementById('auto-gear-off-btn');
    const defBtn = document.getElementById('auto-gear-def-btn');
    if (!offBtn || !defBtn) return;
    offBtn.className = 'auto-gear-btn' + (autoGearMode === 'offensive' ? ' offensive' : '');
    defBtn.className = 'auto-gear-btn' + (autoGearMode === 'defensive' ? ' defensive' : '');
}

// ── Per-slot auto-gear ────────────────────────────────────────────────────────

const slotGearModes = [null,null,null,null,null].map(() => 'none');

function restoreSlotGearBtnStates() {
    slotGearModes.forEach((_, idx) => {
        resetSlotOffBtn(idx);
        resetSlotDefBtn(idx);
    });
}

function resetSlotOffBtn(idx) {
    const btn = document.getElementById('slot-off-btn-' + idx);
    if (!btn) return;
    const hasChar = slotData[idx] && slotData[idx].character;
    if (!hasChar) { btn.style.borderColor = '#2d3142'; btn.style.color = '#2d3142'; return; }
    if (slotGearModes[idx] === 'offensive') { btn.style.borderColor = '#ef4444'; btn.style.color = '#f87171'; }
    else { btn.style.borderColor = '#2d3142'; btn.style.color = '#475569'; }
}

function resetSlotDefBtn(idx) {
    const btn = document.getElementById('slot-def-btn-' + idx);
    if (!btn) return;
    const hasChar = slotData[idx] && slotData[idx].character;
    if (!hasChar) { btn.style.borderColor = '#2d3142'; btn.style.color = '#2d3142'; return; }
    if (slotGearModes[idx] === 'defensive') { btn.style.borderColor = '#3b82f6'; btn.style.color = '#60a5fa'; }
    else { btn.style.borderColor = '#2d3142'; btn.style.color = '#475569'; }
}

function applySlotAutoGear(slotIndex, mode) {
    if (slotGearModes[slotIndex] === mode) {
        slotGearModes[slotIndex] = 'none';
        renderTeamGrid();
        return;
    }
    slotGearModes[slotIndex] = mode;
    const slot = slotData[slotIndex];
    if (!slot || !slot.character) { renderTeamGrid(); return; }
    const info   = getCharInfo(slot.character);
    const cls    = info.class;
    if (!cls || !autoGearPresets[cls]) { renderTeamGrid(); return; }
    const preset = autoGearPresets[cls][mode];
    if (!preset) { renderTeamGrid(); return; }
    Object.keys(preset).forEach(cat => {
        const gearName  = preset[cat];
        if (!gearName) return;
        const gearEntry = (db[cat] || []).find(g => g.name === gearName);
        if (!gearEntry) return;
        if (gearEntry.class && gearEntry.class !== cls) return;
        if (gearEntry.classes && !gearEntry.classes.includes(cls)) return;
        if (gearEntry.excludeClass && gearEntry.excludeClass === cls) return;
        if (gearEntry.unique) {
            const alreadyUsed = slotData.some((s, i) => i !== slotIndex && s.gear[cat] === gearName);
            if (alreadyUsed) return;
        }
        slot.gear[cat] = gearName;
    });
    renderTeamGrid();
    const modal = document.getElementById('selection-modal');
    if (modal && modal.style.display !== 'none' && currentActiveCategory === 'gear') closeModal();
}

// ── Stat presets ──────────────────────────────────────────────────────────────

const STAT_PRESETS_BY_CATEGORY = {
    Weapon: [
        { id: 'w-4atk',     label: '4×ATK',      color: '#fb923c', stats: ['ATK','ATK','ATK','ATK'] },
        { id: 'w-4cd',      label: '4×CD',        color: '#f472b6', stats: ['CD','CD','CD','CD'] },
        { id: 'w-2atk2cd',  label: '2×ATK/CD',    color: '#fbbf24', stats: ['ATK','ATK','CD','CD'] },
        { id: 'w-4idr',     label: '4×IDR',       color: '#a78bfa', stats: ['IDR','IDR','IDR','IDR'] },
        { id: 'w-2atk2idr', label: '2×ATK/IDR',   color: '#fbbf24', stats: ['ATK','ATK','IDR','IDR'] },
        { id: 'w-2cd2idr',  label: '2×CD/IDR',    color: '#fbbf24', stats: ['CD','CD','IDR','IDR'] },
        { id: 'w-3cd1atk',  label: '3×CD/ATK',    color: '#f472b6', stats: ['CD','CD','CD','ATK'] },
        { id: 'w-3atk1cd',  label: '3×ATK/CD',    color: '#fb923c', stats: ['ATK','ATK','ATK','CD'] },
        { id: 'w-3idr1atk', label: '3×IDR/ATK',   color: '#a78bfa', stats: ['IDR','IDR','IDR','ATK'] },
        { id: 'w-3idr1cd',  label: '3×IDR/CD',    color: '#a78bfa', stats: ['IDR','IDR','IDR','CD'] },
    ],
    Armor: [
        { id: 'a-4cr',      label: '4×CR',        color: '#fb923c', stats: ['CR','CR','CR','CR'] },
        { id: 'a-4bc',      label: '4×BC',        color: '#60a5fa', stats: ['BC','BC','BC','BC'] },
        { id: 'a-4hp',      label: '4×HP',        color: '#34d399', stats: ['HP','HP','HP','HP'] },
        { id: 'a-2cr2bc',   label: '2×CR/BC',     color: '#fbbf24', stats: ['CR','CR','BC','BC'] },
        { id: 'a-3cr1bc',   label: '3×CR/BC',     color: '#fb923c', stats: ['CR','CR','CR','BC'] },
        { id: 'a-3bc1cr',   label: '3×BC/CR',     color: '#60a5fa', stats: ['BC','BC','BC','CR'] },
    ],
    Helmet: [
        { id: 'h-4hp',      label: '4×HP',        color: '#34d399', stats: ['HP','HP','HP','HP'] },
    ],
    Rune: [
        { id: 'r-4cd',      label: '4×CD',        color: '#f472b6', stats: ['CD','CD','CD','CD'] },
        { id: 'r-4hp',      label: '4×HP',        color: '#34d399', stats: ['HP','HP','HP','HP'] },
        { id: 'r-2cd2hp',   label: '2×CD/HP',     color: '#fbbf24', stats: ['CD','CD','HP','HP'] },
    ],
};

const STAT_PRESETS  = Object.values(STAT_PRESETS_BY_CATEGORY).flat();
const STAT_OPTIONS  = ['ATK','CD','IDR','HP'];

let activeStatFilter = null;

function statFilterLabel(stats) {
    if (!stats || stats.length === 0) return '';
    const counts = {};
    stats.forEach(s => { counts[s] = (counts[s] || 0) + 1; });
    return Object.entries(counts).map(([s, n]) => n > 1 ? `${n}×${s}` : s).join(' / ');
}

function setStatPreset(id) {
    const preset = STAT_PRESETS.find(p => p.id === id);
    if (!preset) return;
    const isActive = activeStatFilter &&
        JSON.stringify([...activeStatFilter.stats].sort()) === JSON.stringify([...preset.stats].sort());
    if (isActive) {
        activeStatFilter = null;
        updateStatFilterUI();
        applyGearStatFilter();
        if (currentActiveCategory === 'gear' && currentGearCategory && currentActiveSection !== null)
            saveStatPriorityToSlot(currentActiveSection, currentGearCategory, false);
        return;
    }
    activeStatFilter = { stats: [...preset.stats] };
    updateStatFilterUI();
    applyGearStatFilter();
    if (currentActiveCategory === 'gear' && currentGearCategory && currentActiveSection !== null)
        saveStatPriorityToSlot(currentActiveSection, currentGearCategory, false);
}

function clearStatFilter() {
    activeStatFilter = null;
    updateStatFilterUI();
    applyGearStatFilter();
}

function renderStatPresets(gearCat, isUnique) {
    const row = document.getElementById('stat-preset-row');
    if (!row) return;
    const presets = STAT_PRESETS_BY_CATEGORY[gearCat] || [];
    if (isUnique) {
        row.innerHTML = `<span class="filter-label" style="min-width:46px;">STAT<br>PRESETS</span>
            <span class="text-[10px] text-slate-600 italic flex items-center gap-1"><i class="fa-solid fa-lock" style="font-size:9px;"></i>Unique item — no custom stats</span>`;
        return;
    }
    if (presets.length === 0) {
        row.innerHTML = `<span class="filter-label" style="min-width:46px;">STAT<br>PRESETS</span>
            <span class="text-[10px] text-slate-600 italic">No presets for ${gearCat}</span>`;
        return;
    }
    row.innerHTML = `<span class="filter-label" style="min-width:46px;">STAT<br>PRESETS</span>` +
        presets.map(p => {
            const isActive = activeStatFilter &&
                JSON.stringify([...activeStatFilter.stats].sort()) === JSON.stringify([...p.stats].sort());
            return `<button id="spbtn-${p.id}" onclick="setStatPreset('${p.id}')" class="filter-btn${isActive ? ' active' : ''}" style="width:auto;padding:3px 8px;" title="${p.label}">
                <span style="font-size:10px;font-weight:700;color:${p.color};white-space:nowrap;">${p.label}</span>
            </button>`;
        }).join('');
}

function updateStatFilterUI() {
    if (currentGearCategory) {
        const gearEntry = currentActiveSection !== null && slotData[currentActiveSection]
            ? (() => {
                const eq = slotData[currentActiveSection]?.gear?.[currentGearCategory];
                return eq ? (db[currentGearCategory] || []).find(g => g.name === eq) : null;
            })()
            : null;
        renderStatPresets(currentGearCategory, gearEntry?.unique || false);
    }
}

function applyGearStatFilter() {
    if (currentActiveCategory !== 'gear') return;
    const charName  = slotData[currentActiveSection]?.character;
    const charInfo  = getCharInfo(charName);
    const charClass = charInfo.class || '';
    const gearItems = db[currentGearCategory] || [];
    let items = charClass
    ? gearItems.filter(item => {
        // 1. If it has a strict single class limit that doesn't match, hide it
        if (item.class && item.class !== charClass) return false;
        
        // 2. If it has a multi-class array limit, character class MUST be in it
        if (item.classes && !item.classes.includes(charClass)) return false;
        
        // 3. If it has an explicit exclusion rule, hide it
        if (item.excludeClass && item.excludeClass === charClass) return false;
        
        return true;
      })
    : gearItems;
    const rawSearch = (document.getElementById('modal-search')?.value || '').toLowerCase();
    if (rawSearch) items = items.filter(i => i.name.toLowerCase().includes(rawSearch));
    renderModalGrid(items, false);
}

function saveStatPriorityToSlot(slotIdx, cat, closeAfter = true) {
    if (!slotData[slotIdx]) return;
    if (!slotData[slotIdx].statPriority) slotData[slotIdx].statPriority = { Weapon: [], Armor: [], Helmet: [], Rune: [] };
    slotData[slotIdx].statPriority[cat] = activeStatFilter ? [...activeStatFilter.stats] : [];
    renderTeamGrid();
    if (closeAfter) closeModal();
}

// ── Gear validation ───────────────────────────────────────────────────────────

function validateSlotGear(slotIndex) {
    const slot = slotData[slotIndex];
    if (!slot.character) return;
    const charInfo  = getCharInfo(slot.character);
    const charClass = charInfo.class;
    for (let gearCat in slot.gear) {
        const gearName = slot.gear[gearCat];
        if (!gearName) continue;
        const gear = db[gearCat].find(g => g.name === gearName);
        if (!gear || 
            (gear.class && gear.class !== charClass) || 
            (gear.classes && !gear.classes.includes(charClass)) || 
            (gear.excludeClass && gear.excludeClass === charClass)) {
            slot.gear[gearCat] = null;
        }
    }
}

// ── Element colour maps — module-level so imageExport.js can reference them ───

const EL_BORDER_COLOR = {
    Fire:     '#f9731655', Frost:    '#60a5fa55', Nature:   '#4ade8055',
    Holy:     '#fde68a55', Shock:    '#c084fc55', Chaos:    '#f472b655',
    Radiance: '#fcd34d55',
};
const EL_BG_COLOR = {
    Fire:     '#1c100a22', Frost:    '#0c162622', Nature:   '#091a0f22',
    Holy:     '#1a150522', Shock:    '#180f2a22', Chaos:    '#1a0c1422',
    Radiance: '#1a140322',
};
const EL_BORDER_SOLID = {
    Fire:     '#f97316', Frost:    '#60a5fa', Nature:   '#4ade80',
    Holy:     '#fde68a', Shock:    '#c084fc', Chaos:    '#f472b6',
    Radiance: '#fcd34d',
};
// Rich dark element color for the character portrait background
const EL_PORTRAIT_BG = {
    Fire:     '#3d1505', Frost:    '#071428', Nature:   '#061a08',
    Holy:     '#1c1403', Shock:    '#160a2a', Chaos:    '#1a0812',
    Radiance: '#1a1200',
};

// ── Team grid render ──────────────────────────────────────────────────────────

function renderTeamGrid() {
    for (let i = 0; i < slotData.length; i++) validateSlotGear(i);

    const grid = document.getElementById('team-grid');
    grid.innerHTML = '';

    // Local aliases — reference the module-level maps
    const _elBorderColor = EL_BORDER_COLOR;
    const _elBgColor     = EL_BG_COLOR;
    const _elBorderSolid = EL_BORDER_SOLID;
    const _elPortraitBg  = EL_PORTRAIT_BG;

    slotData.forEach((slot, index) => {
        const charInfo   = slot.character ? getCharInfo(slot.character) : {};
        const el         = charInfo.element || '';
        const elBorder      = _elBorderColor[el]  || '#2d314255';
        const elBg          = _elBgColor[el]       || '';
        const elSolid       = _elBorderSolid[el]   || '#2d3142';
        const elPortraitBg  = el ? (_elPortraitBg[el] || '#20222f') : '#20222f';

        const section = document.createElement('section');
        // Outer card: element-tinted border + subtle bg tint matching formation slot style
        const sectionBg = el ? _elBgColor[el] : '#181a2400';
        section.className = "rounded-xl p-3 flex flex-col gap-2 shadow-xl";
        section.style.cssText = `background:${el ? `linear-gradient(135deg, ${_elBgColor[el] || '#181a24'} 0%, #181a24 60%)` : '#181a24'};border:1px solid ${elBorder};`;
        section.draggable = true;
        section.dataset.index = index;

        section.innerHTML = `
            <div class="flex gap-1.5">
                <button id="slot-off-btn-${index}" onclick="applySlotAutoGear(${index},'offensive')" title="Auto-equip offensive preset" ${!slot.character ? 'disabled' : ''} style="flex:1;height:24px;background:#1a1c28;border:1px solid #2d3142;border-radius:5px;font-size:10px;font-weight:700;color:${slot.character ? '#475569' : '#2d3142'};cursor:${slot.character ? 'pointer' : 'not-allowed'};transition:all 0.15s ease;display:flex;align-items:center;justify-content:center;gap:3px;opacity:${slot.character ? '1' : '0.4'};" ${slot.character ? `onmouseover="this.style.borderColor='#ef4444';this.style.color='#f87171'" onmouseout="resetSlotOffBtn(${index})"` : ''}>Off</button>
                <button id="slot-def-btn-${index}" onclick="applySlotAutoGear(${index},'defensive')" title="Auto-equip defensive preset" ${!slot.character ? 'disabled' : ''} style="flex:1;height:24px;background:#1a1c28;border:1px solid #2d3142;border-radius:5px;font-size:10px;font-weight:700;color:${slot.character ? '#475569' : '#2d3142'};cursor:${slot.character ? 'pointer' : 'not-allowed'};transition:all 0.15s ease;display:flex;align-items:center;justify-content:center;gap:3px;opacity:${slot.character ? '1' : '0.4'};" ${slot.character ? `onmouseover="this.style.borderColor='#3b82f6';this.style.color='#60a5fa'" onmouseout="resetSlotDefBtn(${index})"` : ''}>Def</button>
            </div>
            <div class="relative rounded-lg overflow-hidden flex flex-col items-center justify-center cursor-pointer p-0 h-48 group transition-all" style="background:${elPortraitBg};${slot.character ? `box-shadow:0 0 0 1px ${elSolid}88 inset,0 0 0 3px ${elSolid}22 inset;` : `box-shadow:0 0 0 1px #334155 inset;border:1px dashed #334155;`}" onclick="openModal('${index}', 'character')">
                <div id="char-display-${index}" class="w-full h-full">
                    ${slot.character ? (() => {
                        const imgSrc   = getSlotCharImg(index);
                        const skins    = getSkins(slot.character);
                        const hasSkins = Array.isArray(skins) && skins.length > 0;
                        const skinIdx  = slotSkinIndex[index];
                        const totalVariants = hasSkins ? skins.length + 1 : 1;
                        const dotsHtml = hasSkins && totalVariants > 1
                            ? `<div class="skin-dots">${Array.from({length: totalVariants}, (_, i) =>
                                `<div class="skin-dot${i === skinIdx ? ' active' : ''}"></div>`).join('')}</div>`
                            : '';
                        return `
                            <div class="relative w-full h-full">
                                <img src="${imgSrc || ''}" alt="${slot.character}" class="w-full h-full object-cover" style="object-position:${getFacePosition(imgSrc)};" onerror="this.style.display='none'">
                                ${hasSkins ? `<button class="skin-swap-btn${skinIdx > 0 ? ' skin-active' : ''}" onclick="cycleSkin(${index}, event)" title="Swap skin"><i class="fa-solid fa-shirt" style="font-size:10px;"></i></button>` : ''}
                                ${dotsHtml}
                                <div class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent"></div>
                                <div class="absolute bottom-2 left-2 right-2 text-center">
                                    <span class="text-xs text-white font-bold drop-shadow-lg">${slot.character}${skinIdx > 0 ? `<span style="font-size:9px;color:#7c9dff;"> ✦</span>` : ''}</span>
                                </div>
                            </div>`;
                    })() : `
                        <div class="text-center flex flex-col items-center justify-center w-full h-full p-2">
                            <i class="fa-solid fa-user-plus text-2xl text-slate-500 mb-2"></i>
                            <span class="text-xs text-slate-400 font-medium">Add Character</span>
                        </div>`}
                </div>
            </div>
            <div class="grid grid-cols-2 gap-2.5">
                ${categories.map(cat => {
                    const sp       = slot.statPriority?.[cat] || [];
                    const spLabel  = sp.length > 0 ? (() => {
                        const counts = {};
                        sp.forEach(x => { counts[x] = (counts[x]||0)+1; });
                        return Object.entries(counts).map(([s,n]) => n>1?`${n}×${s}`:s).join('/');
                    })() : '';
                    const statColors = { ATK:'#fb923c', CD:'#f472b6', IDR:'#a78bfa', HP:'#34d399' };
                    const firstStat  = sp[0] || '';
                    const badgeColor = statColors[firstStat] || '#4b6bfb';
                    const gearEntry  = slot.gear[cat] ? db[cat].find(g => g.name === slot.gear[cat]) : null;
                    const isUnique   = gearEntry?.unique || false;
                    const squircleStyle = isUnique
                        ? 'background:#180f2a !important;border-color:#a855f7 !important;box-shadow:0 0 0 1px #a855f733 inset !important;'
                        : '';
                    return `
                    <div class="flex flex-col gap-0.5" data-gear-cat="${cat}">
                        <div class="slot-squircle bg-slotBg border border-slate-700 flex flex-col items-center justify-center cursor-pointer p-1 relative" style="${squircleStyle}" onclick="openModal('${index}', 'gear', '${cat}')">
                            <div id="gear-display-${index}-${cat}" class="gear-display">
                                ${slot.gear[cat] ? (() => {
                                    const gearData = db[cat].find(g => g.name === slot.gear[cat]);
                                    return gearData
                                        ? `<img src="${gearData.img}" alt="${slot.gear[cat]}" class="rounded" onerror="this.style.display='none'; this.nextElementSibling.style.display='block'"><span class="text-xs text-slate-200" style="display:none">${slot.gear[cat]}</span>`
                                        : `<span class="text-xs text-slate-200">${slot.gear[cat]}</span>`;
                                })() : `<span class="text-[10px] text-slate-400 font-mono">${cat}</span>`}
                            </div>
                        </div>
                        <div data-stat-badge style="background:#0f111a;border:1px solid ${spLabel ? badgeColor+'55' : '#2d314255'};border-radius:5px;padding:0 4px;text-align:center;font-size:8px;font-weight:800;color:${spLabel ? badgeColor : '#475569'};letter-spacing:0.03em;line-height:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;cursor:pointer;height:24px;display:flex;align-items:center;justify-content:center;" onclick="openModal('${index}', 'gear', '${cat}')" title="${spLabel ? 'Stat priority: '+spLabel : 'Set stat priority'}">${spLabel || '—'}</div>
                    </div>`;
                }).join('')}
            </div>
            <div class="relative bg-slotBg rounded-lg h-40 flex flex-col items-center justify-center cursor-pointer overflow-hidden" style="border:1px solid ${elBorder || '#2d314255'};" onclick="openModal('${index}', 'card')">
                <div id="card-display-${index}" class="card-display w-full h-full">
                    ${slot.card ? (() => {
                        const cardData = db.cards.find(c => c.name === slot.card);
                        const cName    = cardData?.cardName || slot.card;
                        const cChar    = cardData?.charName || '';
                        const showChar = cChar && cChar !== cName;
                        return `
                            <div class="relative w-full h-full">
                                <img src="${cardData?.img || ''}" alt="${slot.card}" class="w-full h-full object-cover">
                                <div class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/90 to-transparent"></div>
                                <div class="absolute bottom-1 left-1 right-1 text-center flex flex-col items-center gap-0">
                                    <span class="text-[10px] text-white font-bold drop-shadow-lg leading-tight">${cName}</span>
                                    ${showChar ? `<span class="text-[9px] drop-shadow-lg leading-tight" style="color:rgba(255,255,255,0.55);">(${cChar})</span>` : ''}
                                </div>
                            </div>`;
                    })() : `<span class="text-xs text-slate-400">Add Card</span>`}
                </div>
            </div>`;

        section.ondragstart = (e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('dragType', 'character');
            e.dataTransfer.setData('dragIndex', index);
        };
        section.ondragover = (e) => e.preventDefault();
        section.ondrop = (e) => {
            e.preventDefault();
            const dragType  = e.dataTransfer.getData('dragType');
            const dragIndex = parseInt(e.dataTransfer.getData('dragIndex'));
            if (dragType === 'character') {
                const to = parseInt(index);
                [slotData[dragIndex], slotData[to]] = [slotData[to], slotData[dragIndex]];
                [slotSkinIndex[dragIndex], slotSkinIndex[to]] = [slotSkinIndex[to], slotSkinIndex[dragIndex]];
                formationSlots = [1, 3, 4, 0, 2, -1];
                renderTeamGrid();
                if (typeof bstatDealt !== 'undefined' && bstatDealt) renderBStatBars();
            }
        };

        grid.appendChild(section);
    });

    updateFormation();
    renderPets();
    restoreSlotGearBtnStates();
}

// ── Formation ─────────────────────────────────────────────────────────────────

// Image cache for formation slot face-crop icons (reuse battlestats cache if available)
const _formImgCache = {};

function _drawFormationFace(canvas, imgSrc, size) {
    function doDraw(img) {
        // Scale canvas backing store by devicePixelRatio for sharp rendering
        // on high-DPI screens. CSS width/height stay at the logical size.
        const dpr  = window.devicePixelRatio || 1;
        const phys = Math.round(size * dpr);

        if (canvas.width !== phys || canvas.height !== phys) {
            canvas.width  = phys;
            canvas.height = phys;
        }

        const ctx = canvas.getContext('2d');
        const iw  = img.naturalWidth  || img.width;
        const ih  = img.naturalHeight || img.height;

        // Use getFacePosition (from index.html) for smart face crop
        const posStr = (typeof getFacePosition === 'function') ? getFacePosition(imgSrc) : '50% 10%';
        const parts  = posStr.split(' ');
        const faceCX = parseFloat(parts[0]) / 100;
        const faceCY = parseFloat(parts[1]) / 100;

        // Crop a square from the source, centred on the detected face
        const cropSide = Math.min(iw, ih * 0.65);
        const srcX = Math.max(0, Math.min(iw - cropSide, (iw * faceCX) - cropSide / 2));
        const srcY = Math.max(0, Math.min(ih - cropSide, (ih * faceCY) - cropSide / 2));

        ctx.clearRect(0, 0, phys, phys);
        ctx.save();
        ctx.beginPath();
        ctx.arc(phys / 2, phys / 2, phys / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, srcX, srcY, cropSide, cropSide, 0, 0, phys, phys);
        ctx.restore();
    }

    const cached = _formImgCache[imgSrc] || (typeof _dmgImgCache !== 'undefined' && _dmgImgCache[imgSrc]);
    if (cached) {
        doDraw(cached);
    } else {
        const img = new Image();
        img.onload = () => { _formImgCache[imgSrc] = img; doDraw(img); };
        img.onerror = () => {};
        img.src = imgSrc;
    }
}

function updateFormation() {
    const ICON_SIZE = 34; // px — diameter of circular avatar

    formationSlots.forEach((teamSlotIdx, formIdx) => {
        const el = document.getElementById(`form-slot-${formIdx}`);
        if (!el) return;

        if (teamSlotIdx === -1 || !slotData[teamSlotIdx] || !slotData[teamSlotIdx].character) {
            el.innerHTML = '<span style="color:#475569;font-size:12px;">-</span>';
            el.style.position = 'relative';
            return;
        }

        const charName  = slotData[teamSlotIdx].character;
        const charEntry = (typeof db !== 'undefined' && db.characters)
            ? db.characters.find(c => c.name === charName)
            : null;

        // Get skin-aware image src
        const imgSrc = (typeof getSlotCharImg === 'function')
            ? (getSlotCharImg(teamSlotIdx) || (charEntry && charEntry.img))
            : (charEntry && charEntry.img);

        // Element border colour for the circle ring
        const charInfo  = (typeof getCharInfo === 'function') ? getCharInfo(charName) : {};
        const elColors  = {
            Fire:'#f97316', Frost:'#60a5fa', Nature:'#4ade80', Holy:'#fde68a',
            Shock:'#c084fc', Chaos:'#f472b6', Radiance:'#fcd34d'
        };
        const ringColor = elColors[charInfo.element] || '#2d3142';

        const canvasId = `form-face-${formIdx}`;

        // Use relative positioning so the icon can be pinned to the right edge
        el.style.position       = 'relative';
        el.style.display        = 'flex';
        el.style.alignItems     = 'center';
        el.style.justifyContent = 'center';
        el.style.overflow       = 'hidden';
        el.style.padding        = '0';

        el.innerHTML = `
            <span style="font-size:10px;font-weight:700;color:#e2e8f0;
                         overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
                         max-width:calc(100% - ${ICON_SIZE + 6}px);
                         text-align:center;">${charName}</span>
            ${imgSrc ? `<canvas id="${canvasId}" width="${ICON_SIZE}" height="${ICON_SIZE}"
                style="position:absolute;left:4px;top:50%;transform:translateY(-50%);
                       width:${ICON_SIZE}px;height:${ICON_SIZE}px;flex-shrink:0;
                       border-radius:50%;border:1.5px solid ${ringColor};
                       display:block;background:#20222f;
                       image-rendering:-webkit-optimize-contrast;
                       image-rendering:crisp-edges;"></canvas>` : ''}`;

        // Draw face crop after DOM update
        if (imgSrc) {
            requestAnimationFrame(() => {
                const canvas = document.getElementById(canvasId);
                if (canvas) _drawFormationFace(canvas, imgSrc, ICON_SIZE);
            });
        }
    });
}

function setupFormationDragDrop() {
    document.querySelectorAll('[data-form-idx]').forEach(slot => {
        slot.ondragstart = (e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('dragType', 'formation');
            e.dataTransfer.setData('dragIndex', slot.dataset.formIdx);
            slot.style.opacity = '0.5';
        };
        slot.ondragend   = () => { slot.style.opacity = '1'; };
        slot.ondragover  = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
        slot.ondrop      = (e) => {
            e.preventDefault();
            const dragType  = e.dataTransfer.getData('dragType');
            const dragIndex = parseInt(e.dataTransfer.getData('dragIndex'));
            if (dragType === 'formation') {
                const toIdx = parseInt(slot.dataset.formIdx);
                [formationSlots[dragIndex], formationSlots[toIdx]] = [formationSlots[toIdx], formationSlots[dragIndex]];
                updateFormation();
            }
        };
    });
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function openModal(slotIndex, type, gearCat = null) {
    currentActiveSection  = slotIndex;
    currentActiveCategory = type;
    currentGearCategory   = gearCat;

    document.getElementById('modal-title').innerText = `Select ${gearCat || type}`;
    const searchEl = document.getElementById('modal-search');
    searchEl.value = '';
    const sectionLabel = gearCat || (type === 'character' ? 'characters' : type === 'card' ? 'cards' : type === 'pet' ? 'pets' : type === 'gem' ? 'gems' : type);
    searchEl.placeholder = `Search ${sectionLabel} by name…`;

    const isChar = type === 'character';
    const isPet  = type === 'pet';
    const isGem  = type === 'gem';
    const isGear = type === 'gear';

    document.getElementById('character-filters').classList.toggle('hidden', !isChar);
    document.getElementById('pet-filters').classList.toggle('hidden', !isPet);
    document.getElementById('gem-filters').classList.toggle('hidden', !isGem);
    document.getElementById('gear-filters').classList.toggle('hidden', !isGear);

    const msBar  = document.getElementById('multi-select-bar');
    const showMs = isChar || isPet || type === 'card';
    if (msBar) msBar.classList.toggle('hidden', !showMs);

    multiSelectMode = false;
    multiSelectedItems.clear();
    updateMultiSelectBtn();

    if (!isGem && gemBatchMode) toggleGemBatch();

    if (isChar) {
        resetFilters();
    } else if (isGear) {
        // Restore stat priority from the slot if one was previously saved
        const savedStats = slotData[slotIndex]?.statPriority?.[gearCat];
        activeStatFilter = (savedStats && savedStats.length > 0) ? { stats: [...savedStats] } : null;

        const charName   = slotData[slotIndex]?.character;
        const charInfo   = getCharInfo(charName);
        const charClass  = charInfo.class || '';
        const gearItems  = db[gearCat] || [];
        const filteredItems = charClass
            ? gearItems.filter(item => (!item.class || item.class === charClass) && (!item.classes || item.classes.includes(charClass)) && item.excludeClass !== charClass)
            : gearItems;
        renderModalGrid(filteredItems, false);
        const equippedName  = slotData[slotIndex]?.gear?.[gearCat];
        const equippedEntry = equippedName ? (db[gearCat] || []).find(g => g.name === equippedName) : null;
        setTimeout(() => {
            renderStatPresets(gearCat, equippedEntry?.unique || false);
            updateStatFilterUI();
        }, 0);
    } else if (type === 'gem') {
        const match = slotIndex.match(/pet_(\d+)_gem_\d+/);
        if (match) {
            const petIdx   = parseInt(match[1]);
            _currentGemPetIdx = petIdx;
            const petName  = petsData[petIdx].name;
            const petInfo  = getCharInfo(petName);
            const petElement = petInfo.element || '';
            const gemItems = db.gems || [];
            const filteredItems = petElement ? gemItems.filter(item => item.element === petElement) : gemItems;
            renderModalGrid(filteredItems, false);
            setTimeout(() => updateGemStatUI(petIdx), 0);
        }
    } else if (type === 'ultimate') {
        // Always show the seq bar (it contains the toggle button)
        const seqBar = document.getElementById('ult-seq-bar');
        if (seqBar) seqBar.classList.remove('hidden');
        const msBar2 = document.getElementById('multi-select-bar');
        if (msBar2) msBar2.classList.add('hidden');

        _ultSeqStartIdx = typeof slotIndex === 'number' ? slotIndex : (parseInt(slotIndex) || 0);
        _ultSeqQueue    = [];

        if (_ultSeqEnabled) {
            _ultSeqActive = true;
            _ultSeqUpdateUI();
        } else {
            _ultSeqActive = false;
            _ultSeqUpdateToggleBtn();
        }

        const teamCharacters = slotData.map(s => s.character).filter(Boolean);
        renderModalGrid((db.characters || []).filter(c => teamCharacters.includes(c.name)), false);
    } else if (type === 'card') {
        renderModalGrid(db.cards, false);
    } else if (type === 'pet') {
        renderModalGrid(db.pets, false);
    } else {
        renderModalGrid(db[`${type}s`] || [], false);
    }

    document.getElementById('selection-modal').style.display = 'flex';
    setTimeout(() => { searchEl.focus(); }, 50);
}

function renderModalGrid(items, isChar) {
    const grid = document.getElementById('modal-grid');
    grid.innerHTML = '';

    // Sort items alphabetically by name
    items = [...items].sort((a, b) => a.name.localeCompare(b.name));

    // Determine currently equipped gear item (if a gear modal is open)
    const equippedGearName = (currentActiveCategory === 'gear' && currentActiveSection !== null)
        ? slotData[currentActiveSection]?.gear?.[currentGearCategory] || null
        : null;

    // Pin equipped item to front of list
    if (equippedGearName) {
        const equippedIdx = items.findIndex(i => i.name === equippedGearName);
        if (equippedIdx > 0) {
            items = [items[equippedIdx], ...items.slice(0, equippedIdx), ...items.slice(equippedIdx + 1)];
        }
    }

    // For character modals: pin all currently-slotted characters to the top (in slot order)
    const slottedCharNames = currentActiveCategory === 'character'
        ? slotData.map(s => s.character).filter(Boolean)
        : [];
    if (slottedCharNames.length > 0) {
        const slottedSet  = new Set(slottedCharNames);
        const slottedItems = slottedCharNames
            .map(name => items.find(i => i.name === name))
            .filter(Boolean);
        const restItems    = items.filter(i => !slottedSet.has(i.name));
        items = [...slottedItems, ...restItems];
    }

    // For card modals: pin all currently-equipped cards to the top
    if (currentActiveCategory === 'card') {
        const equippedCardNames = slotData.map(s => s.card).filter(Boolean);
        if (equippedCardNames.length > 0) {
            const equippedSet   = new Set(equippedCardNames);
            const equippedItems = equippedCardNames
                .map(name => items.find(i => i.name === name))
                .filter(Boolean);
            const restItems     = items.filter(i => !equippedSet.has(i.name));
            items = [...equippedItems, ...restItems];
        }
    }

    // None tile
    const noneBox = document.createElement('div');
    noneBox.className = "item-card bg-[#1a1c28] border border-dashed border-slate-600 rounded-lg p-1.5 flex flex-col items-center justify-center cursor-pointer hover:border-red-500 hover:bg-[#1f1014] transition-all";
    noneBox.style.cssText = 'aspect-ratio:3/4;';
    noneBox.onclick = () => clearSlot();
    noneBox.innerHTML = `
        <div class="w-full flex-1 flex flex-col items-center justify-center gap-1.5" style="min-height:60px">
            <i class="fa-solid fa-xmark text-xl text-slate-500"></i>
        </div>
        <span class="text-[10px] font-bold text-slate-500 text-center leading-tight w-full truncate">None</span>`;
    grid.appendChild(noneBox);

    // Ultimate extras
    if (currentActiveCategory === 'ultimate') {
        const x2Box = document.createElement('div');
        x2Box.className = "item-card bg-[#1a1c28] border border-dashed border-slate-600 rounded-lg p-1.5 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-[#0c1626] transition-all";
        x2Box.style.cssText = 'aspect-ratio:3/4;';
        x2Box.onclick = () => selectUltimateX2();
        x2Box.innerHTML = `<div class="w-full flex-1 flex flex-col items-center justify-center gap-1.5" style="min-height:60px"><span style="font-size:24px;font-weight:700;color:#60a5fa;">x2</span></div><span class="text-[10px] font-bold text-slate-400 text-center leading-tight w-full truncate">Repeat</span>`;
        grid.appendChild(x2Box);

        const autoBox = document.createElement('div');
        autoBox.className = "item-card bg-[#1a1c28] border border-dashed border-slate-600 rounded-lg p-1.5 flex flex-col items-center justify-center cursor-pointer hover:border-green-500 hover:bg-[#0c1a12] transition-all";
        autoBox.style.cssText = 'aspect-ratio:3/4;';
        autoBox.onclick = () => selectUltimateAuto();
        autoBox.innerHTML = `<div class="w-full flex-1 flex flex-col items-center justify-center gap-1.5" style="min-height:60px"><span style="font-size:20px;font-weight:700;color:#4ade80;">Auto</span></div><span class="text-[10px] font-bold text-slate-400 text-center leading-tight w-full truncate">Auto</span>`;
        grid.appendChild(autoBox);
    }

    items.forEach(item => {
        const isPet       = !isChar && currentActiveCategory === 'pet';
        const info        = (isChar || isPet) ? getCharInfo(item.name) : {};
        const el          = info.element || '';
        const rar         = info.rarity  || '';
        const rarColor    = rar === '5' ? '#fbbf24' : rar === '4' ? '#a78bfa' : '#64748b';
        const isEquipped     = equippedGearName && item.name === equippedGearName;
        const isSelected     = multiSelectMode && multiSelectedItems.has(item.name);
        const isSlotted      = slottedCharNames.includes(item.name);
        const isSlottedPet   = isPet && petsData.some(p => p.name === item.name);
        const isSlottedCard  = currentActiveCategory === 'card' && slotData.some(s => s.card === item.name);
        const isHighlighted  = isSlotted || isSlottedPet || isSlottedCard || isEquipped;
        const maxSlots    = currentActiveCategory === 'pet' ? 3 : 5;
        const atCap       = multiSelectMode && multiSelectedItems.size >= maxSlots && !isSelected;
        const imgFit      = (isChar || isPet) ? 'object-cover object-top' : 'object-contain';

        const itemBox     = document.createElement('div');
        itemBox.className = "item-card bg-[#1a1c28] border border-[#2d3142] rounded-lg p-1.5 flex flex-col items-center justify-between transition-all"
            + (isSelected ? ' multi-selected' : '')
            + (isHighlighted ? ' equipped-item' : '')
            + (atCap ? '' : ' cursor-pointer hover:border-[#4b6bfb] hover:bg-[#1e2240]');
        itemBox.style.cssText = atCap
            ? 'aspect-ratio:3/4;opacity:0.35;cursor:not-allowed;'
            : isHighlighted
                ? 'aspect-ratio:3/4;border-color:#4b6bfb;background:#1a1e36;box-shadow:0 0 0 2px #4b6bfb44 inset;'
                : 'aspect-ratio:3/4;';
        itemBox.onclick = () => selectItem(item);

        const selOverlay = isSelected
            ? '<div style="position:absolute;inset:0;background:rgba(75,107,251,0.25);display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-check text-white" style="font-size:20px;filter:drop-shadow(0 1px 3px #000)"></i></div>'
            : '';
        const rarBadge = rar ? `<span style="position:absolute;top:3px;right:3px;font-size:8px;font-weight:700;color:${rarColor};text-shadow:0 1px 3px #000">${rar}★</span>` : '';
        const inTeamBadge = (isSlotted || isSlottedPet)
            ? `<div style="position:absolute;bottom:3px;left:50%;transform:translateX(-50%);background:#1e3a5f;border:1px solid #3b82f655;color:#60a5fa;font-size:7px;font-weight:800;padding:1px 5px;border-radius:3px;letter-spacing:0.05em;white-space:nowrap;">${isSlottedPet ? 'EQUIPPED' : 'IN TEAM'}</div>`
            : '';

        if (isChar || isPet) {
            itemBox.innerHTML = `
                <div class="w-full flex-1 bg-[#111218] rounded mb-1 flex items-center justify-center text-[10px] text-slate-600 overflow-hidden relative" style="min-height:60px">
                    <img src="${item.img}" alt="${item.name}" class="w-full h-full ${imgFit}" loading="lazy" onerror="this.style.display='none'">
                    ${rarBadge}${selOverlay}${inTeamBadge}
                </div>
                <span class="text-[10px] font-bold text-slate-300 text-center leading-tight w-full truncate">${item.name}</span>
                ${el ? `<span class="char-el-badge badge-${el} mt-0.5">${el}</span>` : ''}`;
        } else {
            const equippedBadge = (isEquipped || isSlottedCard)
                ? `<div style="position:absolute;bottom:3px;left:50%;transform:translateX(-50%);background:#4b6bfb;color:#fff;font-size:7px;font-weight:800;padding:1px 5px;border-radius:3px;letter-spacing:0.05em;white-space:nowrap;">EQUIPPED</div>`
                : '';
            // Cards: show cardName + (charName) as two stacked lines
            const isCard     = currentActiveCategory === 'card';
            const dispName   = isCard ? (item.cardName || item.name) : item.name;
            const dispSub    = isCard && item.charName && item.charName !== dispName ? item.charName : null;
            const nameColor  = isHighlighted ? '#7c9dff' : '#e2e8f0';
            itemBox.innerHTML = `
                <div class="w-full flex-1 bg-[#111218] rounded mb-1 flex items-center justify-center text-[10px] text-slate-600 overflow-hidden relative" style="min-height:60px">
                    <img src="${item.img}" alt="${item.name}" class="w-full h-full object-contain" loading="lazy" onerror="this.style.display='none'">
                    ${selOverlay}${equippedBadge}
                </div>
                <div class="flex flex-col items-center w-full" style="gap:1px;">
                    <span class="text-[10px] font-bold text-center leading-tight w-full truncate" style="color:${nameColor};">${dispName}</span>
                    ${dispSub ? `<span class="text-[9px] text-center w-full truncate" style="color:#64748b;">(${dispSub})</span>` : ''}
                </div>`;
        }

        grid.appendChild(itemBox);
    });
}

function filterGrid(event) {
    if (event && event.key === 'Enter') {
        const grid  = document.getElementById('modal-grid');
        const cards = grid.querySelectorAll('.item-card');
        for (const card of cards) {
            if (card.querySelector('.fa-xmark')) continue;
            card.click();
            return;
        }
        return;
    }
    if (currentActiveCategory === 'character') {
        applyCharacterFilters();
    } else if (currentActiveCategory === 'pet') {
        applyPetFilters();
    } else {
        applyGenericSearch();
    }
}

function applyGenericSearch() {
    const rawSearch = (document.getElementById('modal-search').value || '').toLowerCase();
    const search    = resolveSearch(rawSearch);
    let items = [];

    if (currentActiveCategory === 'card') {
        items = db.cards;
    } else if (currentActiveCategory === 'pet') {
        items = db.pets;
    } else if (currentActiveCategory === 'gem') {
        const match = currentActiveSection.match(/pet_(\d+)_gem_\d+/);
        if (match) {
            const petIdx   = parseInt(match[1]);
            const petName  = petsData[petIdx].name;
            const petInfo  = getCharInfo(petName);
            const petElement = petInfo.element || '';
            items = db.gems || [];
            items = petElement ? items.filter(item => item.element === petElement) : items;
        }
    } else if (currentActiveCategory === 'gear') {
        const charName  = slotData[currentActiveSection]?.character;
        const charInfo  = getCharInfo(charName);
        const charClass = charInfo.class || '';
        const gearItems = db[currentGearCategory] || [];
        items = charClass
            ? gearItems.filter(item => (!item.class || item.class === charClass) && (!item.classes || item.classes.includes(charClass)) && item.excludeClass !== charClass)
            : gearItems;
    }

    let filtered = [...items];
    if (search) {
        filtered = filtered.filter(i => {
            if (i.name.toLowerCase().includes(search)) return true;
            // For cards: also search on cardName and charName
            if (i.cardName && i.cardName.toLowerCase().includes(search)) return true;
            if (i.charName && i.charName.toLowerCase().includes(search)) return true;
            return false;
        });
    }

    // Keep equipped item pinned to top even while searching
    if (currentActiveCategory === 'gear') {
        const equippedName = slotData[currentActiveSection]?.gear?.[currentGearCategory];
        if (equippedName) {
            const eIdx = filtered.findIndex(i => i.name === equippedName);
            if (eIdx > 0) {
                filtered = [filtered[eIdx], ...filtered.slice(0, eIdx), ...filtered.slice(eIdx + 1)];
            }
        }
    }

    renderModalGrid(filtered, false);
}

function selectItem(item) {
    if (multiSelectMode) {
        if (multiSelectedItems.has(item.name)) {
            multiSelectedItems.delete(item.name);
        } else {
            const maxSlots = currentActiveCategory === 'pet' ? 3 : 5;
            if (multiSelectedItems.size >= maxSlots) return;
            multiSelectedItems.add(item.name);
        }
        updateMultiSelectBtn();
        filterGrid();
        return;
    }

    if (currentActiveCategory === 'character') {
        const displaced = slotData[currentActiveSection].character;
        const evictedFrom = [];
        slotData.forEach((slot, i) => {
            if (i !== currentActiveSection && slot.character === item.name) {
                slot.character = null;
                slotGearModes[i] = 'none';
                evictedFrom.push(i);
            }
        });
        slotData[currentActiveSection].character = item.name;
        slotGearModes[currentActiveSection] = 'none';
        slotSkinIndex[currentActiveSection] = 0;

        const activeChars = new Set(slotData.map(s => s.character).filter(Boolean));
        if (displaced && !activeChars.has(displaced)) {
            ultimateRotation.forEach(slot => {
                if (slot.character === displaced) { slot.character = null; slot.time = ''; }
            });
        }
        renderUltimateRotation();
        autoGearMode = 'none';
        updateAutoGearButtons();

    } else if (currentActiveCategory === 'card') {
        slotData.forEach((slot, i) => {
            if (i !== parseInt(currentActiveSection) && slot.card === item.name) slot.card = null;
        });
        slotData[currentActiveSection].card = item.name;

    } else if (currentActiveCategory === 'gear') {
        if (gearBatchMode) {
            const gearEntry  = (db[currentGearCategory] || []).find(g => g.name === item.name);
            let firstPlaced  = false;
            slotData.forEach((slot, i) => {
                if (!slot.character) return;
                const info = getCharInfo(slot.character);
                const cls  = info.class || '';
                if (gearEntry && gearEntry.class && gearEntry.class !== cls) return;
                if (gearEntry && gearEntry.excludeClass && gearEntry.excludeClass === cls) return;
                if (gearEntry && gearEntry.unique) { if (firstPlaced) return; firstPlaced = true; }
                slot.gear[currentGearCategory] = item.name;
                if (!slot.statPriority) slot.statPriority = { Weapon: [], Armor: [], Helmet: [], Rune: [] };
                if (gearEntry && gearEntry.unique) {
                    slot.statPriority[currentGearCategory] = [];
                } else {
                    slot.statPriority[currentGearCategory] = activeStatFilter
                        ? [...activeStatFilter.stats]
                        : (slot.statPriority[currentGearCategory] || []);
                }
            });
            gearBatchMode = false;
            const btn  = document.getElementById('gear-batch-btn');
            if (btn) { btn.classList.remove('active'); btn.querySelector('i').style.color=''; btn.querySelector('span').style.color=''; }
            const hint = document.getElementById('gear-batch-hint');
            if (hint) hint.classList.add('hidden');
        } else {
            const gearEntry = (db[currentGearCategory] || []).find(g => g.name === item.name);
            if (gearEntry && gearEntry.unique) {
                slotData.forEach((slot, i) => {
                    if (i !== parseInt(currentActiveSection) && slot.gear[currentGearCategory] === item.name)
                        slot.gear[currentGearCategory] = null;
                });
            }
            slotData[currentActiveSection].gear[currentGearCategory] = item.name;
            if (!slotData[currentActiveSection].statPriority)
                slotData[currentActiveSection].statPriority = { Weapon: [], Armor: [], Helmet: [], Rune: [] };
            if (item.unique) {
                // Unique items have fixed stats — clear any saved priority for this slot
                slotData[currentActiveSection].statPriority[currentGearCategory] = [];
                activeStatFilter = null;
                renderStatPresets(currentGearCategory, true);
                updateStatFilterUI();
            } else if (activeStatFilter && activeStatFilter.stats.length > 0) {
                slotData[currentActiveSection].statPriority[currentGearCategory] = [...activeStatFilter.stats];
            }
        }
        autoGearMode = 'none';
        updateAutoGearButtons();
        if (typeof slotGearModes !== 'undefined') slotGearModes[currentActiveSection] = 'none';

    } else if (currentActiveCategory === 'pet') {
        const slotIndex = parseInt(currentActiveSection.replace('p', '')) - 1;
        petsData.forEach((pet, i) => {
            if (i !== slotIndex && pet.name === item.name) {
                pet.name = null; pet.gems = [null,null,null,null]; pet.gemStat = null;
            }
        });
        petsData[slotIndex].name = item.name;

    } else if (currentActiveCategory === 'gem') {
        const match = currentActiveSection.match(/pet_(\d+)_gem_(\d+)/);
        if (match) {
            const petIdx = parseInt(match[1]);
            const gemIdx = parseInt(match[2]);
            if (gemBatchMode) {
                petsData[petIdx].gems = [item.name, item.name, item.name, item.name];
            } else {
                petsData[petIdx].gems[gemIdx] = item.name;
            }
            validatePetGems(petIdx);
        }

    } else if (currentActiveCategory === 'ultimate') {
        if (_ultSeqActive && _ultSeqEnabled) {
            // Sequence mode: append to queue, fill next available slot, stay open
            _ultSeqQueue.push(item.name);
            _ultSeqWriteToRotation();
            _ultSeqUpdateUI();
            renderUltimateRotation();
            renderTeamGrid();
            // Auto-close if all visible slots are now filled
            const visibleSlots = _ultSeqVisibleSlotCount();
            const filledFromStart = _ultSeqQueue.length;
            if (filledFromStart >= visibleSlots) {
                closeModal();
            } else {
                _ultSeqRefreshGridCaps();
            }
            return; // skip the closeModal() below
        }
        // Single-pick mode (default): assign to clicked slot and close
        ultimateRotation[currentActiveSection].character = item.name;
        ultimateRotation[currentActiveSection].time      = ultimateRotation[currentActiveSection].time || '';
        renderUltimateRotation();
    }

    renderTeamGrid();
    if (typeof bstatDealt !== 'undefined' && bstatDealt) renderBStatBars();
    closeModal();
}

function clearSlot() {
    if (currentActiveCategory === 'character') {
        const removed = slotData[currentActiveSection].character;
        slotData[currentActiveSection] = _emptySlot();
        slotSkinIndex[currentActiveSection] = 0;
        slotGearModes[currentActiveSection]  = 'none';
        if (removed) {
            ultimateRotation.forEach(slot => {
                if (slot.character === removed) { slot.character = null; slot.time = ''; }
            });
            renderUltimateRotation();
        }
    } else if (currentActiveCategory === 'card') {
        slotData[currentActiveSection].card = null;
    } else if (currentActiveCategory === 'gear') {
        slotData[currentActiveSection].gear[currentGearCategory] = null;
    } else if (currentActiveCategory === 'pet') {
        const slotIndex = parseInt(currentActiveSection.replace('p', '')) - 1;
        petsData[slotIndex].name = null;
        petsData[slotIndex].gems = [null, null, null, null];
        petsData[slotIndex].gemStat = null;
    } else if (currentActiveCategory === 'gem') {
        const match = currentActiveSection.match(/pet_(\d+)_gem_(\d+)/);
        if (match) petsData[parseInt(match[1])].gems[parseInt(match[2])] = null;
    } else if (currentActiveCategory === 'ultimate') {
        if (_ultSeqActive) {
            // None tile in sequence mode = cancel without changes
            closeModal();
            return;
        }
        ultimateRotation[currentActiveSection].character = null;
        renderUltimateRotation();
    }
    renderTeamGrid();
    if (typeof bstatDealt !== 'undefined' && bstatDealt) renderBStatBars();
    closeModal();
}

function closeModal() {
    document.getElementById('selection-modal').style.display = 'none';
    if (typeof gemBatchMode !== 'undefined' && gemBatchMode) toggleGemBatch();
    if (gearBatchMode) {
        gearBatchMode = false;
        const btn  = document.getElementById('gear-batch-btn');
        if (btn) { btn.classList.remove('active'); btn.querySelector('i').style.color=''; btn.querySelector('span').style.color=''; }
        const hint = document.getElementById('gear-batch-hint');
        if (hint) hint.classList.add('hidden');
    }
    multiSelectMode = false;
    multiSelectedItems.clear();
    // Clean up ult sequence mode (keep _ultSeqEnabled so toggle persists)
    _ultSeqActive = false;
    _ultSeqQueue  = [];
    const seqBar = document.getElementById('ult-seq-bar');
    if (seqBar) seqBar.classList.add('hidden');
    // Reset seq UI state for next open
    const _seqCounter = document.getElementById('ult-seq-counter');
    const _seqActions = document.getElementById('ult-seq-actions');
    const _seqPreview = document.getElementById('ult-seq-preview');
    if (_seqCounter) _seqCounter.classList.toggle('hidden', !_ultSeqEnabled);
    if (_seqActions) _seqActions.classList.toggle('hidden', !_ultSeqEnabled);
    if (_seqPreview) _seqPreview.classList.toggle('hidden', !_ultSeqEnabled);
}

// ── Clear all ─────────────────────────────────────────────────────────────────

function clearAllSlots() {
    slotData        = [_emptySlot(), _emptySlot(), _emptySlot(), _emptySlot(), _emptySlot()];
    petsData        = [
        { name: null, gems: [null,null,null,null], gemStat: null },
        { name: null, gems: [null,null,null,null], gemStat: null },
        { name: null, gems: [null,null,null,null], gemStat: null },
    ];
    slotSkinIndex   = [0, 0, 0, 0, 0];
    formationSlots  = [1, 3, 4, 0, 2, -1];
    ultimateRotation = Array(11).fill().map(() => ({ character: null, time: '' }));
    const titleEl   = document.querySelector('h1[contenteditable]');
    if (titleEl) titleEl.innerText = 'My Lost Sword Team';
    // Reset tags
    if (typeof activeTag !== 'undefined') { activeTag = null; }
    if (typeof brawlCharKills !== 'undefined') { brawlCharKills = [0,0,0,0,0]; }
    if (typeof brawlKillCount !== 'undefined') { brawlKillCount = null; }
    if (typeof renderTeamTags === 'function') renderTeamTags();
    if (typeof _applyTagEffects === 'function') _applyTagEffects();
    renderTeamGrid();
    setupFormationDragDrop();
    renderUltimateRotation();
    if (typeof clearBattleStats === 'function') clearBattleStats();
}

// ── Face detection helpers (defined here; detectFace / getFacePosition stay
//    in index.html because they depend on faceapi which is loaded there) ──────

// (No changes needed — getFacePosition is called from renderTeamGrid above
//  and is still declared in index.html where faceapi is available.)

// ── Ult sequence helpers ───────────────────────────────────────────────────────

// How many visible (non-hidden) rotation slots exist from _ultSeqStartIdx onward.
function _ultSeqVisibleSlotCount() {
    const x2Idx   = ultimateRotation.findIndex(s => s.character === 'x2');
    const autoIdx = ultimateRotation.findIndex(s => s.character === 'auto');
    const repeatIdx = x2Idx === -1 && autoIdx === -1 ? -1
        : x2Idx === -1 ? autoIdx : autoIdx === -1 ? x2Idx : Math.min(x2Idx, autoIdx);
    const totalVisible = repeatIdx === -1 ? ultimateRotation.length : repeatIdx + 1;
    return Math.max(0, totalVisible - _ultSeqStartIdx);
}

// Write the current queue into the rotation array starting at _ultSeqStartIdx.
function _ultSeqWriteToRotation() {
    _ultSeqQueue.forEach((charName, i) => {
        const rotIdx = _ultSeqStartIdx + i;
        if (rotIdx < ultimateRotation.length) {
            ultimateRotation[rotIdx].character = charName;
        }
    });
}

// Update the sequence bar UI: counter label, preview chips, undo button visibility.
function _ultSeqUpdateUI() {
    const visibleSlots = _ultSeqVisibleSlotCount();
    const filled       = _ultSeqQueue.length;
    const remaining    = Math.max(0, visibleSlots - filled);

    const counter = document.getElementById('ult-seq-counter');
    if (counter) {
        counter.textContent = remaining > 0
            ? `${filled} placed · ${remaining} remaining`
            : `All ${filled} slots filled`;
        counter.style.color = remaining === 0 ? '#34d399' : '#64748b';
    }

    const undoBtn = document.getElementById('ult-seq-undo-btn');
    if (undoBtn) undoBtn.classList.toggle('hidden', filled === 0);

    const preview = document.getElementById('ult-seq-preview');
    if (!preview) return;
    if (filled === 0) {
        preview.innerHTML = '<span class="text-[10px] text-slate-600 italic">Click characters below to build your rotation…</span>';
        return;
    }

    preview.innerHTML = _ultSeqQueue.map((charName, i) => {
        const charEntry = db.characters ? db.characters.find(c => c.name === charName) : null;
        const imgSrc    = charEntry ? charEntry.img : null;
        const info      = getCharInfo(charName);
        const posColors = { Front: '#f87171', Middle: '#fbbf24', Back: '#60a5fa' };
        const posColor  = posColors[info.position] || '#475569';
        return `<div title="${charName}" style="display:flex;flex-direction:column;align-items:center;gap:2px;flex-shrink:0;">
            <div style="width:28px;height:28px;border-radius:5px;border:2px solid ${posColor};overflow:hidden;background:#20222f;">
                ${imgSrc ? `<img src="${imgSrc}" style="width:100%;height:100%;object-fit:cover;object-position:50% 10%;">` : `<span style="font-size:8px;color:#94a3b8;display:flex;align-items:center;justify-content:center;height:100%;">${charName.substring(0,2)}</span>`}
            </div>
            <span style="font-size:8px;color:#64748b;font-weight:700;">${_ultSeqStartIdx + i + 1}</span>
        </div>`;
    }).join(`<span style="color:#475569;font-size:12px;align-self:center;">›</span>`);
}

// Undo last pick in sequence.
function ultSeqUndo() {
    if (!_ultSeqActive || _ultSeqQueue.length === 0) return;
    _ultSeqQueue.pop();
    _ultSeqWriteToRotation();
    // Clear the slot that was just vacated
    const vacatedIdx = _ultSeqStartIdx + _ultSeqQueue.length;
    if (vacatedIdx < ultimateRotation.length) {
        ultimateRotation[vacatedIdx].character = null;
    }
    _ultSeqUpdateUI();
    renderUltimateRotation();
    renderTeamGrid();
    // Re-enable any greyed-out items in the modal grid
    _ultSeqRefreshGridCaps();
}

// Done button — commit and close.
function ultSeqDone() {
    closeModal();
}

// After each pick, grey out items if cap reached (all slots filled).
function _ultSeqRefreshGridCaps() {
    const visibleSlots = _ultSeqVisibleSlotCount();
    const atCap = _ultSeqQueue.length >= visibleSlots;
    document.querySelectorAll('#modal-grid .item-card').forEach(card => {
        // Skip None/x2/auto tiles (they have fa-xmark or fixed text content)
        if (card.querySelector('.fa-xmark')) return;
        if (atCap) {
            card.style.opacity = '0.35';
            card.style.cursor  = 'not-allowed';
            card.style.pointerEvents = 'none';
        } else {
            card.style.opacity = '';
            card.style.cursor  = 'pointer';
            card.style.pointerEvents = '';
        }
    });
}

// ── Ult sequence toggle ────────────────────────────────────────────────────────

function toggleUltSeqMode() {
    _ultSeqEnabled = !_ultSeqEnabled;
    _ultSeqActive  = _ultSeqEnabled;
    _ultSeqQueue   = [];
    _ultSeqUpdateToggleBtn();
    if (_ultSeqEnabled) {
        _ultSeqUpdateUI();
    } else {
        // Hide seq-only UI elements
        const counter  = document.getElementById('ult-seq-counter');
        const actions  = document.getElementById('ult-seq-actions');
        const preview  = document.getElementById('ult-seq-preview');
        if (counter) counter.classList.add('hidden');
        if (actions) actions.classList.add('hidden');
        if (preview) preview.classList.add('hidden');
        // Re-enable any greyed items
        _ultSeqRefreshGridCaps();
    }
}

function _ultSeqUpdateToggleBtn() {
    const btn = document.getElementById('ult-seq-toggle-btn');
    if (!btn) return;
    if (_ultSeqEnabled) {
        btn.classList.add('active');
        btn.querySelector('i').style.color = '#4b6bfb';
    } else {
        btn.classList.remove('active');
        btn.querySelector('i').style.color = '';
    }
    const actions = document.getElementById('ult-seq-actions');
    if (actions) actions.classList.toggle('hidden', !_ultSeqEnabled);
    const preview = document.getElementById('ult-seq-preview');
    if (preview) preview.classList.toggle('hidden', !_ultSeqEnabled);
    const counter = document.getElementById('ult-seq-counter');
    if (counter) counter.classList.toggle('hidden', !_ultSeqEnabled);
}
