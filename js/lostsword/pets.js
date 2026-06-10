// ── Pets & Gems Data and Logic ─────────────────────────────────────────────

// ── Master pet list ───────────────────────────────────────────────────────────
// Each entry:
//   internalName : the 'Pet_Name_01' filename stem (drives image paths)
//   element      : Fire | Frost | Nature | Holy | Shock | Chaos | Radiance
//   rarity       : '3' | '4' | '5'
//
// TO ADD A PET: push one object here. That's it.

const PETS = [
    // ── Other pets ─────────────────────────────────────────────────────────
    { internalName: 'Pet_Whitey_01',    element: 'Radiance', rarity: '4' },
    { internalName: 'Pet_Gold_01',      element: 'Fire',     rarity: '3' },
    { internalName: 'Pet_Neo_01',       element: 'Frost',    rarity: '4' },
    { internalName: 'Pet_Nightsong_01', element: 'Chaos',    rarity: '4' },
    { internalName: 'Pet_Shiba_01',     element: 'Fire',     rarity: '4' },
    { internalName: 'Pet_Belle_01',     element: 'Nature',   rarity: '4' },
    { internalName: 'Pet_Slime_01',     element: 'Nature',   rarity: '3' },
    { internalName: 'Pet_Retriever_01', element: 'Radiance', rarity: '3' },
    { internalName: 'Pet_Raccoon_01',   element: 'Shock',    rarity: '3' },
    { internalName: 'Pet_Hen_01',       element: 'Shock',    rarity: '3' },
    { internalName: 'Pet_Chick_01',     element: 'Fire',     rarity: '3' },
    { internalName: 'Pet_Momo_01',      element: 'Nature',   rarity: '3' },
    { internalName: 'Pet_Nabi_01',      element: 'Chaos',    rarity: '3' },
    { internalName: 'Pet_Cheese_01',    element: 'Holy',     rarity: '3' },
    { internalName: 'Pet_Coco_01',      element: 'Frost',    rarity: '3' },
    { internalName: 'Pet_Midnight_01',  element: 'Shock',    rarity: '4' },
    { internalName: 'Pet_Phoenix_01',   element: 'Fire',     rarity: '5' },
    { internalName: 'Pet_Fenrir_01',    element: 'Shock',    rarity: '5' },
    { internalName: 'Pet_Griffon_01',   element: 'Nature',   rarity: '5' },
    { internalName: 'Pet_Athena_01',    element: 'Radiance', rarity: '5' },

    // ── Character-form pets ───────────────────────────────────────────────────
    { internalName: 'Pet_UnleashedEva_01', element: 'Shock',    rarity: '5' },
    { internalName: 'Pet_Agravaine_01',    element: 'Chaos',    rarity: '5' },
    { internalName: 'Pet_Anessa_01',       element: 'Frost',    rarity: '5' },
    { internalName: 'Pet_Asuka_01',        element: 'Nature',   rarity: '5' },
    { internalName: 'Pet_Bedivere_01',     element: 'Nature',   rarity: '4' },
    { internalName: 'Pet_NeoBedivere_01',  element: 'Holy',     rarity: '5' },
    { internalName: 'Pet_Belsey_01',       element: 'Fire',     rarity: '5' },
    { internalName: 'Pet_Cristina_01',     element: 'Fire',     rarity: '5' },
    { internalName: 'Pet_DianCecht_01',    element: 'Radiance', rarity: '5' },
    { internalName: 'Pet_Elizabeth_01',    element: 'Fire',     rarity: '5' },
    { internalName: 'Pet_Erin_01',         element: 'Radiance', rarity: '5' },
    { internalName: 'Pet_Estheria_01',     element: 'Chaos',    rarity: '5' },
    { internalName: 'Pet_Eva_01',          element: 'Shock',    rarity: '5' },
    { internalName: 'Pet_Galahad_01',      element: 'Radiance', rarity: '5' },
    { internalName: 'Pet_Guinevere_01',    element: 'Frost',    rarity: '5' },
    { internalName: 'Pet_Hikage_01',       element: 'Nature',   rarity: '5' },
    { internalName: 'Pet_Isabel_01',       element: 'Frost',    rarity: '5' },
    { internalName: 'Pet_Joanofarc_01',    element: 'Shock',    rarity: '5' },
    { internalName: 'Pet_Karishara_01',    element: 'Fire',     rarity: '5' },
    { internalName: 'Pet_Katrin_01',       element: 'Frost',    rarity: '5' },
    { internalName: 'Pet_Kay_01',          element: 'Fire',     rarity: '5' },
    { internalName: 'Pet_Circe_01',        element: 'Chaos',    rarity: '5' },
    { internalName: 'Pet_Lancelot_01',     element: 'Radiance', rarity: '5' },
    { internalName: 'Pet_Lilith_01',       element: 'Chaos',    rarity: '5' },
    { internalName: 'Pet_Lisa_01',         element: 'Chaos',    rarity: '5' },
    { internalName: 'Pet_Lohengrin_01',    element: 'Chaos',    rarity: '5' },
    { internalName: 'Pet_Lua_01',          element: 'Shock',    rarity: '5' },
    { internalName: 'Pet_Lueira_01',       element: 'Frost',    rarity: '5' },
    { internalName: 'Pet_Merlin_01',       element: 'Holy',     rarity: '5' },
    { internalName: 'Pet_SMerry_01',       element: 'Frost',    rarity: '5' },
    { internalName: 'Pet_Morgana_01',      element: 'Chaos',    rarity: '5' },
    { internalName: 'Pet_Morganlefay_01',  element: 'Holy',     rarity: '5' },
    { internalName: 'Pet_Nesha_01',        element: 'Radiance', rarity: '5' },
    { internalName: 'Pet_Palamedes_01',    element: 'Nature',   rarity: '5' },
    { internalName: 'Pet_MaidRita_01',     element: 'Fire',     rarity: '5' },
    { internalName: 'Pet_Ran_01',          element: 'Holy',     rarity: '5' },
    { internalName: 'Pet_Tiamat_01',       element: 'Holy',     rarity: '5' },
    { internalName: 'Pet_Tristan_01',      element: 'Nature',   rarity: '5' },
    { internalName: 'Pet_Vivien_01',       element: 'Nature',   rarity: '5' },
    { internalName: 'Pet_Yumi_01',         element: 'Frost',    rarity: '5' },
    { internalName: 'Pet_Lumi_01',         element: 'Shock',    rarity: '5' },
];

// ── Master gem list ───────────────────────────────────────────────────────────
// Each entry:
//   name    : kebab-case gem name used for image filenames and IDs
//   element : Fire | Frost | Nature | Holy | Shock | Chaos | Radiance
//   shape   : hexagon | octagon | round | square
//
// TO ADD A GEM: push one object here. That's it.

const GEMS = [
    { name: 'amethyst-hexagon',  element: 'Chaos',    shape: 'hexagon'  },
    { name: 'amethyst-octagon',  element: 'Chaos',    shape: 'octagon'  },
    { name: 'amethyst-round',    element: 'Chaos',    shape: 'round'    },
    { name: 'amethyst-square',   element: 'Chaos',    shape: 'square'   },
    { name: 'emerald-hexagon',   element: 'Nature',   shape: 'hexagon'  },
    { name: 'emerald-octagon',   element: 'Nature',   shape: 'octagon'  },
    { name: 'emerald-round',     element: 'Nature',   shape: 'round'    },
    { name: 'emerald-square',    element: 'Nature',   shape: 'square'   },
    { name: 'opal-hexagon',      element: 'Holy',     shape: 'hexagon'  },
    { name: 'opal-octagon',      element: 'Holy',     shape: 'octagon'  },
    { name: 'opal-round',        element: 'Holy',     shape: 'round'    },
    { name: 'opal-square',       element: 'Holy',     shape: 'square'   },
    { name: 'ruby-hexagon',      element: 'Fire',     shape: 'hexagon'  },
    { name: 'ruby-octagon',      element: 'Fire',     shape: 'octagon'  },
    { name: 'ruby-round',        element: 'Fire',     shape: 'round'    },
    { name: 'ruby-square',       element: 'Fire',     shape: 'square'   },
    { name: 'sapphire-hexagon',  element: 'Frost',    shape: 'hexagon'  },
    { name: 'sapphire-octagon',  element: 'Frost',    shape: 'octagon'  },
    { name: 'sapphire-round',    element: 'Frost',    shape: 'round'    },
    { name: 'sapphire-square',   element: 'Frost',    shape: 'square'   },
    { name: 'topaz-hexagon',     element: 'Radiance', shape: 'hexagon'  },
    { name: 'topaz-octagon',     element: 'Radiance', shape: 'octagon'  },
    { name: 'topaz-round',       element: 'Radiance', shape: 'round'    },
    { name: 'topaz-square',      element: 'Radiance', shape: 'square'   },
    { name: 'turquoise-hexagon', element: 'Shock',    shape: 'hexagon'  },
    { name: 'turquoise-octagon', element: 'Shock',    shape: 'octagon'  },
    { name: 'turquoise-round',   element: 'Shock',    shape: 'round'    },
    { name: 'turquoise-square',  element: 'Shock',    shape: 'square'   },
];

// ── Compatibility shims ───────────────────────────────────────────────────────
// The rest of the codebase reads rawPets, petDatabase, rawGems, and gemElements.
// All are derived from the unified arrays above.

// parseName is defined in characters.js (loaded before this file).

const rawPets = PETS.map(p => p.internalName);

const petDatabase = Object.fromEntries(
    PETS.map(p => {
        const displayName = parseName(p.internalName);
        return [displayName, { element: p.element, rarity: p.rarity }];
    })
);

const rawGems = GEMS.map(g => g.name);

const gemElements = Object.fromEntries(GEMS.map(g => [g.name, g.element]));

// ── Pets state ─────────────────────────────────────────────────────────────

let petsData = [
    { name: null, gems: [null, null, null, null], gemStat: null },
    { name: null, gems: [null, null, null, null], gemStat: null },
    { name: null, gems: [null, null, null, null], gemStat: null }
];

// ── Gem stat presets ───────────────────────────────────────────────────────

const GEM_STAT_PRESETS = [
    { id: 'gs-4atk4hp', label: '4×ATK/4×HP', color: '#fb923c', stats: ['ATK','ATK','ATK','ATK','HP','HP','HP','HP'] },
    { id: 'gs-4cd4hp',  label: '4×CD/4×HP',  color: '#f472b6', stats: ['CD','CD','CD','CD','HP','HP','HP','HP'] },
];

// ── Gem batch-select state ─────────────────────────────────────────────────

let gemBatchMode = false;

function toggleGemBatch() {
    gemBatchMode = !gemBatchMode;
    const btn  = document.getElementById('gem-batch-btn');
    const hint = document.getElementById('gem-batch-hint');
    if (gemBatchMode) {
        btn.classList.add('active');
        btn.querySelector('i').style.color = '#4b6bfb';
        btn.querySelector('span').style.color = '#e2e8f0';
        hint.classList.remove('hidden');
    } else {
        btn.classList.remove('active');
        btn.querySelector('i').style.color = '';
        btn.querySelector('span').style.color = '';
        hint.classList.add('hidden');
    }
}

// ── Pet filter state ───────────────────────────────────────────────────────

const activePetFilters = { rarity: new Set(), element: new Set() };

function toggleAllPetFilter(cat) {
    const allValues = {
        rarity:  ['3','4','5'],
        element: ['Fire','Frost','Nature','Holy','Shock','Chaos','Radiance']
    };
    allValues[cat].forEach(val => {
        activePetFilters[cat].delete(val);
        const btn = document.getElementById(`pfbtn-${cat}-${val}`);
        btn && btn.classList.remove('active');
    });
    const allBtn = document.getElementById(`pfbtn-${cat}-all`);
    allBtn && allBtn.classList.add('active');
    applyPetFilters();
}

function togglePetFilter(cat, val) {
    const btn    = document.getElementById(`pfbtn-${cat}-${val}`);
    const allBtn = document.getElementById(`pfbtn-${cat}-all`);
    if (activePetFilters[cat].has(val)) {
        activePetFilters[cat].delete(val);
        btn && btn.classList.remove('active');
        if (activePetFilters[cat].size === 0) allBtn && allBtn.classList.add('active');
    } else {
        activePetFilters[cat].add(val);
        btn && btn.classList.add('active');
        allBtn && allBtn.classList.remove('active');
    }
    applyPetFilters();
}

function resetPetFilters() {
    ['rarity', 'element'].forEach(cat => {
        activePetFilters[cat].forEach(val => {
            const btn = document.getElementById(`pfbtn-${cat}-${val}`);
            btn && btn.classList.remove('active');
        });
        activePetFilters[cat].clear();
        const allBtn = document.getElementById(`pfbtn-${cat}-all`);
        allBtn && allBtn.classList.add('active');
    });
    document.getElementById('modal-search').value = '';
    applyPetFilters();
}

function applyPetFilters() {
    const rawSearch = (document.getElementById('modal-search').value || '').toLowerCase();
    const search    = resolveSearch(rawSearch);
    const pets      = db.pets;
    const filtered  = pets.filter(item => {
        const info = getCharInfo(item.name);
        if (search && !item.name.toLowerCase().includes(search)) return false;
        if (activePetFilters.rarity.size  && !activePetFilters.rarity.has(String(info.rarity || ''))) return false;
        if (activePetFilters.element.size && !activePetFilters.element.has(info.element || ''))        return false;
        return true;
    });
    renderModalGrid(filtered, false);
    const countEl = document.getElementById('pet-showing-count');
    if (countEl) countEl.textContent = `Showing ${filtered.length} of ${pets.length} Pets`;
}

// ── Gem stat preset helpers ────────────────────────────────────────────────

let _currentGemPetIdx = null;

function setGemStatPreset(id) {
    if (_currentGemPetIdx === null) return;
    const preset  = GEM_STAT_PRESETS.find(p => p.id === id);
    if (!preset) return;
    const current = petsData[_currentGemPetIdx].gemStat;
    if (current && JSON.stringify([...current].sort()) === JSON.stringify([...preset.stats].sort())) {
        petsData[_currentGemPetIdx].gemStat = null;
    } else {
        petsData[_currentGemPetIdx].gemStat = [...preset.stats];
    }
    updateGemStatUI(_currentGemPetIdx);
    renderGemStatBadge(_currentGemPetIdx);
}

function updateGemStatUI(petIdx) {
    const current = petIdx !== null ? petsData[petIdx].gemStat : null;
    GEM_STAT_PRESETS.forEach(p => {
        const btn = document.getElementById(`gspbtn-${p.id}`);
        if (!btn) return;
        const isActive = current &&
            JSON.stringify([...current].sort()) === JSON.stringify([...p.stats].sort());
        btn.classList.toggle('active', isActive);
    });
}

function renderGemStatBadge(petIdx) {
    const badgeEl = document.getElementById(`gem-stat-badge-${petIdx}`);
    if (!badgeEl) return;
    const stat = petsData[petIdx].gemStat;
    if (!stat || stat.length === 0) {
        badgeEl.style.background   = '#0f111a';
        badgeEl.style.borderColor  = '#2d314255';
        badgeEl.style.color        = '#475569';
        badgeEl.textContent        = '—';
        return;
    }
    const counts = {};
    stat.forEach(s => { counts[s] = (counts[s] || 0) + 1; });
    const label = Object.entries(counts).map(([s, n]) => n > 1 ? `${n}×${s}` : s).join('/');
    const match = GEM_STAT_PRESETS.find(p =>
        JSON.stringify([...p.stats].sort()) === JSON.stringify([...stat].sort())
    );
    const color = match ? match.color : '#4b6bfb';
    badgeEl.style.background  = '#0f111a';
    badgeEl.style.borderColor = color + '55';
    badgeEl.style.color       = color;
    badgeEl.textContent       = label;
}

function clearGemStat() {
    if (_currentGemPetIdx === null) return;
    petsData[_currentGemPetIdx].gemStat = null;
    updateGemStatUI(_currentGemPetIdx);
    renderGemStatBadge(_currentGemPetIdx);
}

function renderAllGemStatBadges() {
    for (let i = 0; i < 3; i++) renderGemStatBadge(i);
}

// ── Validation ─────────────────────────────────────────────────────────────

function validatePetGems(petIdx) {
    const pet = petsData[petIdx];
    if (!pet || !pet.name) return;
    const petInfo    = getCharInfo(pet.name);
    const petElement = petInfo.element;
    for (let gemIdx = 0; gemIdx < 4; gemIdx++) {
        const gemName    = pet.gems[gemIdx];
        if (!gemName) continue;
        const gemElement = gemElements[gemName];
        if (gemElement && gemElement !== petElement) pet.gems[gemIdx] = null;
    }
}

// ── Render ─────────────────────────────────────────────────────────────────

function renderPets() {
    for (let i = 0; i < 3; i++) validatePetGems(i);

    const petDisplays = [
        document.getElementById('pet-display-p1'),
        document.getElementById('pet-display-p2'),
        document.getElementById('pet-display-p3')
    ];

    petDisplays.forEach((el, i) => {
        if (!el) return;
        const petName = petsData[i].name;
        if (!petName) {
            el.innerHTML = `<span class="text-xs text-slate-400">+</span>`;
            return;
        }
        const pet = db.pets.find(p => p.name === petName);
        el.innerHTML = `<img src="${pet?.img || ''}" class="w-full h-full object-cover rounded-lg">`;
    });

    for (let petIdx = 0; petIdx < 3; petIdx++) {
        for (let gemIdx = 0; gemIdx < 4; gemIdx++) {
            const gemName = petsData[petIdx].gems[gemIdx];
            const gemEl   = document.getElementById(`gem-p${petIdx + 1}-${gemIdx}`);
            if (gemEl) {
                gemEl.innerHTML = gemName
                    ? `<img src="Assets/lostsword/gems/${gemName}.webp" class="w-7 h-7 object-contain" alt="${gemName}">`
                    : `<span class="text-xs font-bold text-slate-500 leading-none">+</span>`;
            }
        }
    }

    document.querySelectorAll('[data-pet-idx]').forEach(slot => {
        slot.style.opacity = '1';
    });

    setupPetDragDrop();
    renderAllGemStatBadges();
}

// ── Drag & drop ────────────────────────────────────────────────────────────

function setupPetDragDrop() {
    document.querySelectorAll('[data-pet-idx]').forEach(slot => {
        slot.ondragstart = (e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('dragType', 'pet');
            e.dataTransfer.setData('dragIndex', slot.dataset.petIdx);
            slot.style.opacity = '0.5';
        };
        slot.ondragend = () => {
            slot.style.opacity = '1';
            document.querySelectorAll('[data-pet-idx]').forEach(s => { s.style.opacity = '1'; });
        };
        slot.ondragover = (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        };
        slot.ondrop = (e) => {
            e.preventDefault();
            const dragType  = e.dataTransfer.getData('dragType');
            const dragIndex = parseInt(e.dataTransfer.getData('dragIndex'));
            if (dragType === 'pet') {
                const toIdx = parseInt(slot.dataset.petIdx);
                [petsData[dragIndex], petsData[toIdx]] = [petsData[toIdx], petsData[dragIndex]];
                document.querySelectorAll('[data-pet-idx]').forEach(s => { s.style.opacity = '1'; });
                renderPets();
            }
        };
    });
}

// Populate normalised lookup index for pets (merges into shared _dbIndex from characters.js)
Object.keys(petDatabase).forEach(k => {
    if (typeof _dbIndex !== "undefined") _dbIndex[k.replace(/\s+/g, "").toLowerCase()] = k;
});
