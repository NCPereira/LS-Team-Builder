// ── Preset System ─────────────────────────────────────────────────────────────
// Supports two modes:
//   • Folder mode  (Chrome/Edge): File System Access API — full folder picker,
//     subfolder organisation, incremental saves, damage-history scanning.
//   • Fallback mode (Firefox/Safari/any): standard <a download> for saving and
//     <input type="file"> for loading. No folder structure, but fully functional.

const _fsaSupported = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

let _presetsDir = null;
let _pendingSaveTitle = '';

// ── Capability detection ──────────────────────────────────────────────────────
// Called once on DOMContentLoaded to patch the UI for non-FSA browsers.

function _patchUIForBrowser() {
    if (_fsaSupported) return; // Chrome/Edge — keep everything as-is

    // Replace "Load Preset" dropdown button with a plain file-input button
    const loadBtn = document.querySelector('[onclick="togglePresetDropdown(event)"]');
    if (loadBtn) {
        // Create hidden file input
        const fi = document.createElement('input');
        fi.type   = 'file';
        fi.accept = '.json,application/json';
        fi.multiple = true;
        fi.style.display = 'none';
        fi.id = 'fallback-preset-file-input';
        fi.addEventListener('change', () => {
            [...fi.files].forEach(f => _loadPresetFromFile(f));
            fi.value = '';
        });
        document.body.appendChild(fi);

        loadBtn.setAttribute('onclick', '');
        loadBtn.addEventListener('click', () => fi.click());
        // Update label
        loadBtn.innerHTML = loadBtn.innerHTML
            .replace('Load Preset', 'Load Preset (.json)')
            .replace('fa-folder-open', 'fa-file-import');
    }

    // Update "Save Preset" button — it will use download fallback
    const saveBtn = document.querySelector('[onclick="savePreset()"]');
    if (saveBtn) {
        saveBtn.title = 'Download preset as a .json file';
    }

    // Hide damage history "Select Folder" button (requires FSA)
    const dtgBtn = document.querySelector('[onclick*="toggleDtgDropdown"]');
    if (dtgBtn) {
        dtgBtn.closest('.relative')?.style && (dtgBtn.closest('.relative').style.display = 'none');
    }

    // Show a small browser notice inline in the footer's left text area
    const footerVersion = document.querySelector('#page-footer > div:first-child');
    if (footerVersion) {
        footerVersion.innerHTML = 'Layout Engine v3.0 | LSTB Web Edition'
            + ' &nbsp;<span style="color:#475569;font-size:10px;">·</span>&nbsp; '
            + '<i class="fa-solid fa-circle-info" style="color:#3b82f6;opacity:0.6;font-size:10px;"></i> '
            + '<span style="font-size:10px;color:#475569;font-style:italic;">Firefox: presets save as downloads, load via file picker. '
            + '<a href="https://www.google.com/chrome/" target="_blank" style="color:#60a5fa;">Chrome</a>'
            + ' or <a href="https://www.microsoft.com/en-us/edge" target="_blank" style="color:#60a5fa;">Edge</a>'
            + ' unlock folder management.</span>';
    }
}

// ── Fallback: load a .json file directly ─────────────────────────────────────

async function _loadPresetFromFile(file) {
    try {
        const text = await file.text();
        const preset = JSON.parse(text);
        if (!preset.slotData || !preset.petsData || !preset.formationSlots) {
            alert('Invalid preset file: ' + file.name);
            return;
        }
        _applyPreset(preset);
    } catch (e) {
        alert('Failed to load preset "' + file.name + '": ' + e.message);
    }
}

// ── Shared preset application ─────────────────────────────────────────────────

function _applyPreset(preset) {
    slotData = preset.slotData;
    slotData.forEach(s => { if (!s.statPriority) s.statPriority = { Weapon: [], Armor: [], Helmet: [], Rune: [] }; });
    petsData = preset.petsData;
    petsData.forEach(p => { if (!('gemStat' in p)) p.gemStat = null; });
    formationSlots   = preset.formationSlots;
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
    document.getElementById('preset-dropdown')?.classList.add('hidden');
}

// ── Preset payload builder ────────────────────────────────────────────────────

function _buildPresetPayload(title) {
    return {
        version: 1,
        title,
        slotData, petsData, formationSlots, ultimateRotation,
        slotSkinIndex:   (typeof slotSkinIndex   !== 'undefined' ? slotSkinIndex   : [0,0,0,0,0]),
        bstatDealt:      (typeof bstatDealt       !== 'undefined' ? bstatDealt      : null),
        bstatPrev:       (typeof bstatPrev        !== 'undefined' ? bstatPrev       : null),
        brawlKillCount:  (typeof brawlKillCount   !== 'undefined' ? brawlKillCount  : null),
    };
}

// ── FSA init ──────────────────────────────────────────────────────────────────

async function initPresetsFolder() {
    if (!_fsaSupported) return; // shouldn't be called in fallback mode
    try {
        const root = await window.showDirectoryPicker({ mode: 'readwrite' });
        _presetsDir = await root.getDirectoryHandle('presets', { create: true });
        await scanPresets();
    } catch (e) {
        if (e.name !== 'AbortError') console.warn('Folder access error:', e);
    }
}

// ── Scan presets dir (FSA mode only) ─────────────────────────────────────────

async function scanPresets() {
    const list = document.getElementById('preset-list');
    if (!list) return;
    if (!_presetsDir) {
        list.innerHTML = '<div class="px-3 py-3 text-xs text-slate-500 text-center italic">Click Load Preset to grant folder access</div>';
        return;
    }

    const rootFiles  = [];
    const subfolders = {};

    for await (const [name, handle] of _presetsDir.entries()) {
        if (handle.kind === 'file' && name.endsWith('.json')) {
            rootFiles.push(name);
        } else if (handle.kind === 'directory') {
            subfolders[name] = [];
            for await (const [fname, fhandle] of handle.entries()) {
                if (fhandle.kind === 'file' && fname.endsWith('.json'))
                    subfolders[name].push(fname);
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

    function makeRow(displayName, onClick) {
        const row = document.createElement('button');
        row.className = 'w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-[#21243a] hover:text-white transition-all flex items-center gap-2 group';
        row.innerHTML = '<i class="fa-solid fa-file-code text-slate-500 group-hover:text-blue-400 flex-shrink-0 transition-colors"></i><span class="truncate">' + displayName + '</span>';
        row.onclick = onClick;
        return row;
    }

    if (rootFiles.length > 0) {
        rootFiles.forEach(name => {
            list.appendChild(makeRow(name.replace(/\.json$/, '').replace(/_/g, ' '), () => loadPresetByName(name, null)));
        });
    }

    const folderNames = Object.keys(subfolders).sort();
    folderNames.forEach(folder => {
        const files  = subfolders[folder];
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
                list.appendChild(makeRow(name.replace(/\.json$/, '').replace(/_/g, ' '), () => loadPresetByName(name, folder)));
            });
        }
    });
}

// ── Filename helpers (FSA mode) ───────────────────────────────────────────────

const NON_RAID_FOLDERS = new Set([
    'star','brawl','abyss','stonehenge','snowcap','avalon',
    'Star','Brawl','Abyss','Stonehenge','Snowcap','Avalon',
]);

function isNonRaidFolder(name) {
    if (!name) return false;
    return NON_RAID_FOLDERS.has(name) || NON_RAID_FOLDERS.has(name.toLowerCase());
}

function buildFilename(subfolderName) {
    const d = new Date();
    const dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    if (subfolderName && isNonRaidFolder(subfolderName)) {
        const title = (_pendingSaveTitle || 'preset').replace(/[^a-zA-Z0-9\s_-]/g, '').trim().replace(/\s+/g, '_').substring(0, 40);
        return (title || 'preset') + '.json';
    }
    return subfolderName ? subfolderName + '_' + dateStr + '.json' : dateStr + '.json';
}

// ── Save preset ───────────────────────────────────────────────────────────────

async function savePreset() {
    _pendingSaveTitle = document.querySelector('h1[contenteditable]')?.innerText?.trim() || 'My Lost Sword Team';

    // ── Fallback mode (Firefox etc.) ──────────────────────────────────────────
    if (!_fsaSupported) {
        const payload  = _buildPresetPayload(_pendingSaveTitle);
        const json     = JSON.stringify(payload, null, 2);
        const blob     = new Blob([json], { type: 'application/json' });
        const url      = URL.createObjectURL(blob);
        const safeTitle = _pendingSaveTitle.replace(/[^a-zA-Z0-9\s_-]/g, '').trim().replace(/\s+/g, '_').substring(0, 40) || 'preset';
        const d        = new Date();
        const dateStr  = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        const filename = safeTitle + '_' + dateStr + '.json';

        const a    = document.createElement('a');
        a.href     = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);

        // Flash save button
        const btn = document.querySelector('[onclick="savePreset()"]');
        if (btn) {
            const orig = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-check mr-2"></i>Downloaded!';
            btn.classList.replace('text-blue-400', 'text-green-400');
            btn.classList.replace('border-blue-700', 'border-green-700');
            setTimeout(() => {
                btn.innerHTML = orig;
                btn.classList.replace('text-green-400', 'text-blue-400');
                btn.classList.replace('border-green-700', 'border-blue-700');
            }, 1800);
        }
        return;
    }

    // ── FSA mode (Chrome/Edge) ────────────────────────────────────────────────
    if (!_presetsDir) {
        await initPresetsFolder();
        if (!_presetsDir) return;
    }

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

    updateSavePreview(folders.length > 0 ? folders[0] : null);
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

    const filename  = buildFilename(subfolderName);
    let   targetDir = _presetsDir;

    if (subfolderName) {
        targetDir = await _presetsDir.getDirectoryHandle(subfolderName, { create: true });
    }

    let exists = false;
    try { await targetDir.getFileHandle(filename); exists = true; } catch (_) {}
    if (exists && !confirm(`"${filename}" already exists.\nOverwrite it?`)) return;

    const fh       = await targetDir.getFileHandle(filename, { create: true });
    const writable = await fh.createWritable();
    await writable.write(JSON.stringify(_buildPresetPayload(_pendingSaveTitle), null, 2));
    await writable.close();
    await scanPresets();

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

// ── Load preset by name (FSA mode) ────────────────────────────────────────────

async function loadPresetByName(filename, subfolderName) {
    if (!_presetsDir) return;
    try {
        let targetDir = _presetsDir;
        if (subfolderName) targetDir = await _presetsDir.getDirectoryHandle(subfolderName);
        const fh   = await targetDir.getFileHandle(filename);
        const text = await (await fh.getFile()).text();
        _applyPreset(JSON.parse(text));
    } catch (e) {
        alert('Failed to load preset: ' + e.message);
    }
}

// ── Dropdown toggle (FSA mode) ────────────────────────────────────────────────

function togglePresetDropdown(e) {
    e.stopPropagation();
    if (!_fsaSupported) return; // button replaced in fallback mode
    if (!_presetsDir) {
        initPresetsFolder().then(() => {
            if (_presetsDir) document.getElementById('preset-dropdown').classList.remove('hidden');
        });
        return;
    }
    document.getElementById('preset-dropdown').classList.toggle('hidden');
}

// ── Event listeners ───────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    // Patch UI for non-FSA browsers first
    _patchUIForBrowser();

    document.getElementById('subfolder-modal')?.addEventListener('click', function(e) {
        if (e.target === this) closeSubfolderModal();
    });

    document.getElementById('subfolder-list')?.addEventListener('mouseover', function(e) {
        const btn = e.target.closest('button');
        if (!btn) return;
        const folderName = btn.querySelector('span')?.textContent?.trim();
        if (folderName) updateSavePreview(folderName);
    });

    document.addEventListener('click', (e) => {
        const dd = document.getElementById('preset-dropdown');
        if (!dd || dd.classList.contains('hidden')) return;
        if (!dd.contains(e.target)) dd.classList.add('hidden');
    });
});
