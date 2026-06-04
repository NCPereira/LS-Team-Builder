// ── Preset System ─────────────────────────────────────────────────────────────

let _presetsDir = null;
let _pendingSaveTitle = '';

async function initPresetsFolder() {
    if (!window.showDirectoryPicker) {
        alert('Your browser does not support the File System Access API.\nPlease use Chrome or Edge.');
        return;
    }
    try {
        const root = await window.showDirectoryPicker({ mode: 'readwrite' });
        _presetsDir = await root.getDirectoryHandle('presets', { create: true });
        await scanPresets();
    } catch (e) {
        if (e.name !== 'AbortError') console.warn('Folder access error:', e);
    }
}

// Scan presets dir + all subfolders for .json files, grouped by folder
async function scanPresets() {
    const list = document.getElementById('preset-list');
    if (!list) return;
    if (!_presetsDir) {
        list.innerHTML = '<div class="px-3 py-3 text-xs text-slate-500 text-center italic">Click Load Preset to grant folder access</div>';
        return;
    }

    // Collect root files + subfolder files
    const rootFiles = [];
    const subfolders = {}; // { folderName: [filenames] }

    for await (const [name, handle] of _presetsDir.entries()) {
        if (handle.kind === 'file' && name.endsWith('.json')) {
            rootFiles.push(name);
        } else if (handle.kind === 'directory') {
            subfolders[name] = [];
            for await (const [fname, fhandle] of handle.entries()) {
                if (fhandle.kind === 'file' && fname.endsWith('.json')) {
                    subfolders[name].push(fname);
                }
            }
            subfolders[name].sort((a, b) => a.localeCompare(b));
        }
    }
    rootFiles.sort((a, b) => a.localeCompare(b));

    const totalCount = rootFiles.length + Object.values(subfolders).reduce((s, a) => s + a.length, 0);
    if (totalCount === 0) {
        list.innerHTML = '<div class="px-3 py-3 text-xs text-slate-500 text-center italic">No presets found</div>';
        return;
    }

    list.innerHTML = '';

    // Helper to make a file row
    function makeRow(displayName, onClick) {
        const row = document.createElement('button');
        row.className = 'w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-[#21243a] hover:text-white transition-all flex items-center gap-2 group';
        row.innerHTML = '<i class="fa-solid fa-file-code text-slate-500 group-hover:text-blue-400 flex-shrink-0 transition-colors"></i><span class="truncate">' + displayName + '</span>';
        row.onclick = onClick;
        return row;
    }

    // Root files
    if (rootFiles.length > 0) {
        rootFiles.forEach(name => {
            const label = name.replace(/\.json$/, '').replace(/_/g, ' ');
            list.appendChild(makeRow(label, () => loadPresetByName(name, null)));
        });
    }

    // Subfolders
    const folderNames = Object.keys(subfolders).sort();
    folderNames.forEach(folder => {
        const files = subfolders[folder];
        // Folder header
        const header = document.createElement('div');
        header.className = 'px-3 pt-3 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 border-t border-[#2d3142] mt-1';
        header.innerHTML = '<i class="fa-solid fa-folder text-slate-600"></i>' + folder;
        list.appendChild(header);

        if (files.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'px-4 py-1.5 text-[11px] text-slate-600 italic';
            empty.textContent = 'Empty folder';
            list.appendChild(empty);
        } else {
            files.forEach(name => {
                const label = name.replace(/\.json$/, '').replace(/_/g, ' ');
                list.appendChild(makeRow(label, () => loadPresetByName(name, folder)));
            });
        }
    });
}

// Non-raid folders that get title-based filenames instead of date-based
const NON_RAID_FOLDERS = new Set([
    'star', 'brawl', 'abyss', 'stonehenge', 'snowcap', 'avalon',
    'Star', 'Brawl', 'Abyss', 'Stonehenge', 'Snowcap', 'Avalon',
]);

function isNonRaidFolder(name) {
    if (!name) return false;
    return NON_RAID_FOLDERS.has(name) || NON_RAID_FOLDERS.has(name.toLowerCase());
}

// Raid/unknown folders: SubfolderName_YYYY-MM-DD.json
// Non-raid folders (Star, Brawl, Abyss, Stonehenge): sanitized-title.json
function buildFilename(subfolderName) {
    const date = new Date();
    const dateStr = date.getFullYear() + '-'
        + String(date.getMonth() + 1).padStart(2, '0') + '-'
        + String(date.getDate()).padStart(2, '0');
    if (subfolderName && isNonRaidFolder(subfolderName)) {
        const title = (_pendingSaveTitle || 'preset')
            .replace(/[^a-zA-Z0-9\s_-]/g, '')
            .trim()
            .replace(/\s+/g, '_')
            .substring(0, 40);
        return (title || 'preset') + '.json';
    }
    if (subfolderName) {
        return subfolderName + '_' + dateStr + '.json';
    }
    return dateStr + '.json';
}

async function savePreset() {
    if (!_presetsDir) {
        await initPresetsFolder();
        if (!_presetsDir) return; // user cancelled
    }
    _pendingSaveTitle = document.querySelector('h1[contenteditable]')?.innerText?.trim() || 'My Lost Sword Team';

    // Scan subfolders
    const subfolderList = document.getElementById('subfolder-list');
    subfolderList.innerHTML = '<div class="px-3 py-3 text-xs text-slate-500 text-center italic">Scanning folders...</div>';

    const folders = [];
    for await (const [name, handle] of _presetsDir.entries()) {
        if (handle.kind === 'directory') folders.push(name);
    }
    folders.sort((a, b) => a.localeCompare(b));

    subfolderList.innerHTML = '';

    if (folders.length === 0) {
        subfolderList.innerHTML = '<div class="px-3 py-3 text-[11px] text-slate-500 text-center italic">No subfolders found in /presets.<br>Create subfolders in your file system to organise saves.</div>';
    } else {
        folders.forEach(name => {
            const btn = document.createElement('button');
            btn.className = 'w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-[#21243a] hover:text-white transition-all flex items-center gap-3 group rounded-lg mx-0';
            btn.innerHTML = `<i class="fa-solid fa-folder text-yellow-500/70 group-hover:text-yellow-400 text-base flex-shrink-0 transition-colors"></i>
                <span class="flex-1 truncate font-medium">${name}</span>
                <i class="fa-solid fa-chevron-right text-slate-600 group-hover:text-slate-400 text-xs transition-colors"></i>`;
            btn.onclick = () => confirmSaveToFolder(name);
            subfolderList.appendChild(btn);
        });
    }

    // Update preview with no folder selected yet
    updateSavePreview(folders.length > 0 ? folders[0] : null);

    // Show modal
    document.getElementById('subfolder-modal').classList.remove('hidden');
}

function updateSavePreview(subfolderName) {
    const filename = buildFilename(subfolderName);
    const path = subfolderName ? `presets/${subfolderName}/${filename}` : `presets/${filename}`;
    document.getElementById('subfolder-preview').textContent = path;
}

function closeSubfolderModal() {
    document.getElementById('subfolder-modal').classList.add('hidden');
}

async function confirmSaveToFolder(subfolderName) {
    closeSubfolderModal();
    if (!_presetsDir) return;

    const filename = buildFilename(subfolderName);
    let targetDir = _presetsDir;

    if (subfolderName) {
        targetDir = await _presetsDir.getDirectoryHandle(subfolderName, { create: true });
    }

    // Check if file exists
    let exists = false;
    try { await targetDir.getFileHandle(filename); exists = true; } catch (_) {}
    if (exists && !confirm(`"${filename}" already exists.\nOverwrite it?`)) return;

    const fh = await targetDir.getFileHandle(filename, { create: true });
    const writable = await fh.createWritable();
    await writable.write(JSON.stringify({
        version: 1,
        title: _pendingSaveTitle,
        slotData, petsData, formationSlots, ultimateRotation,
        slotSkinIndex: (typeof slotSkinIndex !== 'undefined' ? slotSkinIndex : [0,0,0,0,0]),
        bstatDealt: (typeof bstatDealt !== 'undefined' ? bstatDealt : null),
        bstatPrev:  (typeof bstatPrev  !== 'undefined' ? bstatPrev  : null),
        brawlKillCount: (typeof brawlKillCount !== 'undefined' ? brawlKillCount : null)
    }, null, 2));
    await writable.close();
    await scanPresets();

    // Flash the save button green
    const btn = document.querySelector('[onclick="savePreset()"]');
    if (btn) {
        const orig = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check mr-2"></i>Saved!';
        btn.classList.replace('text-blue-400', 'text-green-400');
        btn.classList.replace('border-blue-700', 'border-green-700');
        setTimeout(() => {
            btn.innerHTML = orig;
            btn.classList.replace('text-green-400', 'text-blue-400');
            btn.classList.replace('border-green-700', 'border-blue-700');
        }, 1800);
    }
}

// Load accepts optional subfolder name; null = root presets dir
async function loadPresetByName(filename, subfolderName) {
    if (!_presetsDir) return;
    try {
        let targetDir = _presetsDir;
        if (subfolderName) {
            targetDir = await _presetsDir.getDirectoryHandle(subfolderName);
        }
        const fh = await targetDir.getFileHandle(filename);
        const text = await (await fh.getFile()).text();
        const preset = JSON.parse(text);
        if (!preset.slotData || !preset.petsData || !preset.formationSlots) {
            alert('Invalid preset file.'); return;
        }
        slotData = preset.slotData;
        // Backfill statPriority for presets saved before this field existed
        slotData.forEach(s => { if (!s.statPriority) s.statPriority = { Weapon: [], Armor: [], Helmet: [], Rune: [] }; });
        petsData = preset.petsData;
        // Backfill gemStat for presets saved before this field existed
        petsData.forEach(p => { if (!('gemStat' in p)) p.gemStat = null; });
        formationSlots = preset.formationSlots;
        ultimateRotation = preset.ultimateRotation || Array(11).fill().map(() => ({ character: null, time: '' }));
        if (typeof brawlKillCount !== 'undefined') brawlKillCount = (preset.brawlKillCount !== undefined ? preset.brawlKillCount : null);
        slotSkinIndex = preset.slotSkinIndex || [0, 0, 0, 0, 0];
        const titleEl = document.querySelector('h1[contenteditable]');
        if (titleEl && preset.title) titleEl.innerText = preset.title;

        if (typeof bstatDealt !== 'undefined') {
            bstatDealt = preset.bstatDealt || null;
            bstatPrev  = preset.bstatPrev  || null;
        }
        renderTeamGrid();
        setupFormationDragDrop();
        renderUltimateRotation();
        if (typeof renderBStatBars === 'function') {
            renderBStatBars();
            const clearBtn  = document.getElementById('battle-stats-clear');
            const updateBtn = document.getElementById('battle-stats-update');
            if (bstatDealt && bstatDealt.length) {
                if (clearBtn)  clearBtn.classList.remove('hidden');
                if (updateBtn) updateBtn.classList.remove('hidden');
            } else {
                if (clearBtn)  clearBtn.classList.add('hidden');
                if (updateBtn) updateBtn.classList.add('hidden');
            }
        }
        document.getElementById('preset-dropdown').classList.add('hidden');
    } catch (e) {
        alert('Failed to load preset: ' + e.message);
    }
}

function togglePresetDropdown(e) {
    e.stopPropagation();
    if (!_presetsDir) {
        initPresetsFolder().then(() => {
            if (_presetsDir) document.getElementById('preset-dropdown').classList.remove('hidden');
        });
        return;
    }
    document.getElementById('preset-dropdown').classList.toggle('hidden');
}

// ── Event listeners (run after DOM is ready) ──────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    // Close subfolder modal on backdrop click
    document.getElementById('subfolder-modal').addEventListener('click', function(e) {
        if (e.target === this) closeSubfolderModal();
    });

    // Update filename preview when hovering folder buttons
    document.getElementById('subfolder-list').addEventListener('mouseover', function(e) {
        const btn = e.target.closest('button');
        if (!btn) return;
        const folderName = btn.querySelector('span')?.textContent?.trim();
        if (folderName) updateSavePreview(folderName);
    });

    // Close preset dropdown on outside click
    document.addEventListener('click', (e) => {
        const dd = document.getElementById('preset-dropdown');
        if (!dd || dd.classList.contains('hidden')) return;
        if (!dd.contains(e.target)) dd.classList.add('hidden');
    });
});
