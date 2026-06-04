// ── Preset System ─────────────────────────────────────────────────────────────
//
// Chrome / Edge  → File System Access API (showDirectoryPicker): full folder
//                  read/write with subfolder organisation.
// Firefox / other → Fallback mode:
//                   • Save  → triggers a JSON file download.
//                   • Load  → <input type="file"> picker; user selects .json files
//                             which are parsed and listed in the dropdown in-memory.

const _ffFallback = !window.showDirectoryPicker;

let _presetsDir      = null;   // FileSystemDirectoryHandle (Chrome only)
let _pendingSaveTitle = '';

// In-memory preset store for Firefox fallback: { filename, subfolder, preset }[]
let _ffPresets = [];

// ── Browser detection helper ──────────────────────────────────────────────────

function _isFirefox() { return _ffFallback; }

// ── Folder initialisation (Chrome) ───────────────────────────────────────────

async function initPresetsFolder() {
    if (_ffFallback) {
        // Firefox: no folder picker — open the load-file dialog instead
        _ffOpenFilePicker();
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

// ── Firefox: file input picker for loading ────────────────────────────────────

function _ffOpenFilePicker() {
    let inp = document.getElementById('_ff_preset_input');
    if (!inp) {
        inp = document.createElement('input');
        inp.type     = 'file';
        inp.id       = '_ff_preset_input';
        inp.accept   = '.json';
        inp.multiple = true;
        inp.style.display = 'none';
        document.body.appendChild(inp);
        inp.addEventListener('change', _ffHandleFiles);
    }
    inp.value = '';
    inp.click();
}

async function _ffHandleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    for (const file of files) {
        try {
            const text   = await file.text();
            const preset = JSON.parse(text);
            if (!preset.slotData) continue;

            // Derive a subfolder from the filename if it matches SubfolderName_YYYY-MM-DD.json
            let subfolder = null;
            const sfMatch = file.name.match(/^([A-Za-z][A-Za-z0-9]*)_\d{4}-\d{2}-\d{2}\.json$/);
            if (sfMatch) subfolder = sfMatch[1];

            // Deduplicate by filename
            _ffPresets = _ffPresets.filter(p => p.filename !== file.name);
            _ffPresets.push({ filename: file.name, subfolder, preset });
        } catch (_) {}
    }

    _ffPresets.sort((a, b) => a.filename.localeCompare(b.filename));
    scanPresets();

    // Show the dropdown
    const dd = document.getElementById('preset-dropdown');
    if (dd) dd.classList.remove('hidden');
}

// ── Scan presets (Chrome: folder entries / Firefox: in-memory) ────────────────

async function scanPresets() {
    const list = document.getElementById('preset-list');
    if (!list) return;

    if (_ffFallback) {
        // Firefox in-memory list
        if (_ffPresets.length === 0) {
            list.innerHTML = '<div class="px-3 py-3 text-xs text-slate-500 text-center italic">Click Load Preset to open .json files</div>';
            return;
        }

        list.innerHTML = '';

        // Group by subfolder
        const rootFiles = _ffPresets.filter(p => !p.subfolder);
        const byFolder  = {};
        _ffPresets.filter(p => p.subfolder).forEach(p => {
            (byFolder[p.subfolder] = byFolder[p.subfolder] || []).push(p);
        });

        rootFiles.forEach(({ filename, preset }) => {
            const label = filename.replace(/\.json$/, '').replace(/_/g, ' ');
            list.appendChild(_makeRow(label, () => _ffApplyPreset(filename)));
        });

        Object.keys(byFolder).sort().forEach(folder => {
            const header = document.createElement('div');
            header.className = 'px-3 pt-3 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 border-t border-[#2d3142] mt-1';
            header.innerHTML = '<i class="fa-solid fa-folder text-slate-600"></i>' + folder;
            list.appendChild(header);
            byFolder[folder].forEach(({ filename }) => {
                const label = filename.replace(/\.json$/, '').replace(/_/g, ' ');
                list.appendChild(_makeRow(label, () => _ffApplyPreset(filename)));
            });
        });

        // Add a "Load more files…" button at the bottom
        const moreBtn = document.createElement('button');
        moreBtn.className = 'w-full text-left px-3 py-2 text-xs text-blue-400 hover:text-blue-300 hover:bg-[#21243a] transition-all flex items-center gap-2 border-t border-[#2d3142] mt-1';
        moreBtn.innerHTML = '<i class="fa-solid fa-folder-open flex-shrink-0"></i><span>Load more files…</span>';
        moreBtn.onclick = () => _ffOpenFilePicker();
        list.appendChild(moreBtn);
        return;
    }

    // Chrome: File System Access API path
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

    if (rootFiles.length > 0) {
        rootFiles.forEach(name => {
            const label = name.replace(/\.json$/, '').replace(/_/g, ' ');
            list.appendChild(_makeRow(label, () => loadPresetByName(name, null)));
        });
    }

    const folderNames = Object.keys(subfolders).sort();
    folderNames.forEach(folder => {
        const files = subfolders[folder];
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
                list.appendChild(_makeRow(label, () => loadPresetByName(name, folder)));
            });
        }
    });
}

function _makeRow(displayName, onClick) {
    const row = document.createElement('button');
    row.className = 'w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-[#21243a] hover:text-white transition-all flex items-center gap-2 group';
    row.innerHTML = '<i class="fa-solid fa-file-code text-slate-500 group-hover:text-blue-400 flex-shrink-0 transition-colors"></i><span class="truncate">' + displayName + '</span>';
    row.onclick = onClick;
    return row;
}

// ── Firefox: apply a preset from in-memory store ──────────────────────────────

function _ffApplyPreset(filename) {
    const entry = _ffPresets.find(p => p.filename === filename);
    if (!entry) return;
    _applyPresetData(entry.preset);
    document.getElementById('preset-dropdown').classList.add('hidden');
}

// ── Shared preset application ─────────────────────────────────────────────────

function _applyPresetData(preset) {
    if (!preset.slotData || !preset.petsData || !preset.formationSlots) {
        alert('Invalid preset file.'); return;
    }
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
            clearBtn  && clearBtn.classList.remove('hidden');
            updateBtn && updateBtn.classList.remove('hidden');
        } else {
            clearBtn  && clearBtn.classList.add('hidden');
            updateBtn && updateBtn.classList.add('hidden');
        }
    }
}

// ── Filename builder ──────────────────────────────────────────────────────────

const NON_RAID_FOLDERS = new Set([
    'star', 'brawl', 'abyss', 'stonehenge', 'snowcap', 'avalon',
    'Star', 'Brawl', 'Abyss', 'Stonehenge', 'Snowcap', 'Avalon',
]);

function isNonRaidFolder(name) {
    if (!name) return false;
    return NON_RAID_FOLDERS.has(name) || NON_RAID_FOLDERS.has(name.toLowerCase());
}

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
    if (subfolderName) return subfolderName + '_' + dateStr + '.json';
    return dateStr + '.json';
}

// ── Save ──────────────────────────────────────────────────────────────────────

async function savePreset() {
    _pendingSaveTitle = document.querySelector('h1[contenteditable]')?.innerText?.trim() || 'My Lost Sword Team';

    if (_ffFallback) {
        // Firefox: skip subfolder modal — just download directly
        _ffDownloadPreset(null);
        return;
    }

    if (!_presetsDir) {
        await initPresetsFolder();
        if (!_presetsDir) return;
    }

    // Chrome: show subfolder picker modal
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

// Firefox download helper
function _ffDownloadPreset(subfolderName) {
    const filename = buildFilename(subfolderName);
    const data = JSON.stringify({
        version: 1,
        title: _pendingSaveTitle,
        slotData, petsData, formationSlots, ultimateRotation,
        slotSkinIndex: (typeof slotSkinIndex !== 'undefined' ? slotSkinIndex : [0,0,0,0,0]),
        bstatDealt: (typeof bstatDealt !== 'undefined' ? bstatDealt : null),
        bstatPrev:  (typeof bstatPrev  !== 'undefined' ? bstatPrev  : null),
        brawlKillCount: (typeof brawlKillCount !== 'undefined' ? brawlKillCount : null)
    }, null, 2);

    const blob = new Blob([data], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    // Flash save button green
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

    // Add to in-memory store so it appears in the dropdown immediately
    const preset = JSON.parse(data);
    _ffPresets = _ffPresets.filter(p => p.filename !== filename);
    _ffPresets.push({ filename, subfolder: subfolderName, preset });
    _ffPresets.sort((a, b) => a.filename.localeCompare(b.filename));
    scanPresets();
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

    if (_ffFallback) {
        _ffDownloadPreset(subfolderName);
        return;
    }

    if (!_presetsDir) return;

    const filename = buildFilename(subfolderName);
    let targetDir = _presetsDir;
    if (subfolderName) {
        targetDir = await _presetsDir.getDirectoryHandle(subfolderName, { create: true });
    }

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

// ── Load (Chrome) ─────────────────────────────────────────────────────────────

async function loadPresetByName(filename, subfolderName) {
    if (!_presetsDir) return;
    try {
        let targetDir = _presetsDir;
        if (subfolderName) targetDir = await _presetsDir.getDirectoryHandle(subfolderName);
        const fh   = await targetDir.getFileHandle(filename);
        const text = await (await fh.getFile()).text();
        _applyPresetData(JSON.parse(text));
        document.getElementById('preset-dropdown').classList.add('hidden');
    } catch (e) {
        alert('Failed to load preset: ' + e.message);
    }
}

// ── Dropdown toggle ───────────────────────────────────────────────────────────

function togglePresetDropdown(e) {
    e.stopPropagation();
    const dd = document.getElementById('preset-dropdown');

    if (_ffFallback) {
        // Firefox: if we already have presets in memory just toggle; otherwise open picker
        if (_ffPresets.length > 0) {
            dd.classList.toggle('hidden');
        } else {
            _ffOpenFilePicker();
        }
        return;
    }

    if (!_presetsDir) {
        initPresetsFolder().then(() => {
            if (_presetsDir) dd.classList.remove('hidden');
        });
        return;
    }
    dd.classList.toggle('hidden');
}

// ── Event listeners ───────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('subfolder-modal').addEventListener('click', function(e) {
        if (e.target === this) closeSubfolderModal();
    });

    document.getElementById('subfolder-list').addEventListener('mouseover', function(e) {
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

    // Firefox: show a small badge on the Load Preset button so users know
    // they'll be picking files rather than a folder
    if (_ffFallback) {
        const loadBtn = document.querySelector('[onclick="togglePresetDropdown(event)"]');
        if (loadBtn) {
            loadBtn.title = 'Firefox: click to open .json preset files';
            const badge = document.createElement('span');
            badge.style.cssText = 'font-size:8px;background:#1e3a5f;color:#60a5fa;border:1px solid #1e40af;border-radius:3px;padding:1px 4px;margin-left:2px;letter-spacing:0.04em;font-weight:700;';
            badge.textContent = 'FILE';
            loadBtn.appendChild(badge);
        }
    }
});
