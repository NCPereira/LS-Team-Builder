// ── Preset System ─────────────────────────────────────────────────────────────
// Supports two modes:
//   • Folder mode  (Chrome/Edge): File System Access API — full folder picker,
//     subfolder organisation, incremental saves, damage-history scanning.
//   • IndexedDB mode (Firefox/Safari/any): identical UI — same dropdown list,
//     same subfolder-modal save flow — backed by IndexedDB instead of the FS.

const _fsaSupported = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

let _presetsDir = null;
let _pendingSaveTitle = '';

// ══════════════════════════════════════════════════════════════════════════════
// ── IndexedDB helpers (fallback mode only) ────────────────────────────────────
// Keys are stored as "folder/filename" or "filename" for root-level files.
// ══════════════════════════════════════════════════════════════════════════════

const _IDB_NAME    = 'lstb-presets';
const _IDB_STORE   = 'presets';
const _IDB_VERSION = 1;
let   _idb         = null;   // opened IDBDatabase, or null

function _openIDB() {
    if (_idb) return Promise.resolve(_idb);
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(_IDB_NAME, _IDB_VERSION);
        req.onupgradeneeded = e => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(_IDB_STORE))
                db.createObjectStore(_IDB_STORE); // key = path string
        };
        req.onsuccess = e => { _idb = e.target.result; resolve(_idb); };
        req.onerror   = e => reject(e.target.error);
    });
}

// Get all stored keys → array of strings like "Fenrir/Fenrir_2024-01-01.json"
async function _idbListAll() {
    const db    = await _openIDB();
    return new Promise((resolve, reject) => {
        const tx   = db.transaction(_IDB_STORE, 'readonly');
        const req  = tx.objectStore(_IDB_STORE).getAllKeys();
        req.onsuccess = e => resolve(e.target.result);
        req.onerror   = e => reject(e.target.error);
    });
}

async function _idbGet(key) {
    const db = await _openIDB();
    return new Promise((resolve, reject) => {
        const tx  = db.transaction(_IDB_STORE, 'readonly');
        const req = tx.objectStore(_IDB_STORE).get(key);
        req.onsuccess = e => resolve(e.target.result);
        req.onerror   = e => reject(e.target.error);
    });
}

async function _idbPut(key, value) {
    const db = await _openIDB();
    return new Promise((resolve, reject) => {
        const tx  = db.transaction(_IDB_STORE, 'readwrite');
        const req = tx.objectStore(_IDB_STORE).put(value, key);
        req.onsuccess = () => resolve();
        req.onerror   = e => reject(e.target.error);
    });
}

async function _idbDelete(key) {
    const db = await _openIDB();
    return new Promise((resolve, reject) => {
        const tx  = db.transaction(_IDB_STORE, 'readwrite');
        const req = tx.objectStore(_IDB_STORE).delete(key);
        req.onsuccess = () => resolve();
        req.onerror   = e => reject(e.target.error);
    });
}

// Parse stored keys into { rootFiles: string[], subfolders: {name: string[]} }
async function _idbGetTree() {
    const keys       = await _idbListAll();
    const rootFiles  = [];
    const subfolders = {};
    keys.forEach(key => {
        const slash = key.indexOf('/');
        if (slash === -1) {
            rootFiles.push(key);
        } else {
            const folder = key.substring(0, slash);
            const file   = key.substring(slash + 1);
            if (!subfolders[folder]) subfolders[folder] = [];
            subfolders[folder].push(file);
        }
    });
    rootFiles.sort((a, b) => a.localeCompare(b));
    Object.keys(subfolders).forEach(f => subfolders[f].sort((a, b) => a.localeCompare(b)));
    return { rootFiles, subfolders };
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Browser capability patching ───────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function _patchUIForBrowser() {
    if (_fsaSupported) return; // Chrome/Edge — keep everything as-is

    // The "Load Preset" button already toggles the dropdown via togglePresetDropdown(event).
    // In fallback mode we keep the same dropdown UI — it's now backed by IndexedDB.
    // No button replacement needed; togglePresetDropdown handles the IDB path.

    // Update "Save Preset" button tooltip
    const saveBtn = document.querySelector('[onclick="savePreset()"]');
    if (saveBtn) saveBtn.title = 'Save preset (stored locally in browser + download option)';

    // Hide damage history "Select Folder" button (requires FSA)
    const dtgBtn = document.querySelector('[onclick*="toggleDtgDropdown"]');
    if (dtgBtn) dtgBtn.closest?.('.relative')?.style && (dtgBtn.closest('.relative').style.display = 'none');

    // Footer notice — short, non-intrusive
    const footerVersion = document.querySelector('#page-footer > div:first-child');
    if (footerVersion) {
        footerVersion.innerHTML = 'Layout Engine v3.0 | LSTB Web Edition'
            + ' &nbsp;<span style="color:#475569;font-size:10px;">·</span>&nbsp;'
            + ' <i class="fa-solid fa-folder-open" style="color:#3b82f6;opacity:0.7;font-size:10px;"></i>'
            + ' <span style="font-size:10px;color:#475569;font-style:italic;">'
            + 'Firefox: <a href="#" onclick="idbSelectFolder();return false;" style="color:#60a5fa;font-weight:600;">Select presets folder</a>'
            + ' to sync all your presets, or <a href="#" onclick="idbImportFiles();return false;" style="color:#60a5fa;">import individual files</a>.'
            + '</span>';
    }
}

// ── IDB: select the entire presets folder (webkitdirectory) ──────────────────
// Firefox supports <input webkitdirectory> which gives access to a whole folder
// tree. We read every .json file and store it under "subfolder/filename" in IDB,
// preserving the exact structure from disk. The picker looks for a "presets"
// folder inside the chosen root — if the user selects the presets folder itself
// we handle that too.

function idbSelectFolder() {
    const fi = document.createElement('input');
    fi.type              = 'file';
    fi.webkitdirectory   = true;    // Firefox + Chrome
    fi.multiple          = true;
    fi.style.display     = 'none';

    fi.addEventListener('change', async () => {
        const allFiles = [...fi.files];
        fi.value = '';
        if (!allFiles.length) { fi.remove(); return; }

        // Determine the key prefix to strip.
        // allFiles[0].webkitRelativePath looks like "presets/Fenrir/Fenrir_2024-01-01.json"
        // or "MyFolder/presets/Fenrir/Fenrir_2024-01-01.json"
        // We want keys relative to the "presets" folder, so strip everything up to and
        // including the last "presets/" segment. If no "presets" segment is found,
        // strip just the top-level folder name so we get "filename" or "sub/filename".
        const firstPath = allFiles[0].webkitRelativePath || '';
        const presetsIdx = firstPath.toLowerCase().lastIndexOf('presets/');
        const stripPrefix = presetsIdx !== -1
            ? firstPath.substring(0, presetsIdx + 'presets/'.length)
            : (firstPath.indexOf('/') !== -1 ? firstPath.substring(0, firstPath.indexOf('/') + 1) : '');

        const jsonFiles = allFiles.filter(f => f.name.endsWith('.json'));
        if (!jsonFiles.length) {
            alert('No .json files found in the selected folder.');
            fi.remove();
            return;
        }

        // Show a brief status in the dropdown while importing
        const list = document.getElementById('preset-list');
        if (list) list.innerHTML = `<div class="px-3 py-3 text-xs text-slate-500 text-center italic">Importing ${jsonFiles.length} files…</div>`;

        let imported = 0, skipped = 0;
        for (const f of jsonFiles) {
            try {
                const text   = await f.text();
                const preset = JSON.parse(text);
                if (!preset.slotData) { skipped++; continue; }

                // Build IDB key: strip the prefix, result is e.g. "Fenrir/Fenrir_2024-01-01.json"
                const relPath = f.webkitRelativePath || f.name;
                const key     = stripPrefix ? relPath.replace(stripPrefix, '') : relPath;
                await _idbPut(key, text);
                imported++;
            } catch (e) { skipped++; console.warn('Skipped', f.webkitRelativePath, e); }
        }

        fi.remove();
        await scanPresets();    // refresh the list

        // Show result in the dropdown header area briefly
        if (list) {
            const notice = document.createElement('div');
            notice.className = 'px-3 py-2 text-[11px] text-emerald-400 text-center font-semibold border-b border-[#2d3142]';
            notice.textContent = `✓ Imported ${imported} preset${imported !== 1 ? 's' : ''}${skipped ? ` (${skipped} skipped)` : ''}`;
            list.prepend(notice);
            setTimeout(() => notice.remove(), 4000);
        }
    });

    document.body.appendChild(fi);
    fi.click();
}

// ── IDB: import individual .json files (fallback if folder picker isn't enough)
function idbImportFiles() {
    const fi = document.createElement('input');
    fi.type     = 'file';
    fi.accept   = '.json,application/json';
    fi.multiple = true;
    fi.style.display = 'none';
    fi.addEventListener('change', async () => {
        const files = [...fi.files];
        if (!files.length) { fi.remove(); return; }

        const folderName = prompt(
            'Import into which folder? (leave blank for root, or type a name like "Fenrir", "Avalon"…)',
            ''
        )?.trim() ?? '';

        let imported = 0;
        for (const f of files) {
            try {
                const text = await f.text();
                const preset = JSON.parse(text);
                if (!preset.slotData) { console.warn('Skipping invalid preset:', f.name); continue; }
                const key = folderName ? folderName + '/' + f.name : f.name;
                await _idbPut(key, text);
                imported++;
            } catch (e) { console.warn('Failed to import', f.name, e); }
        }
        fi.value = '';
        fi.remove();
        alert(`Imported ${imported} file${imported !== 1 ? 's' : ''}${folderName ? ' into "' + folderName + '"' : ' (root)'}.`);
        const dd = document.getElementById('preset-dropdown');
        if (dd && !dd.classList.contains('hidden')) scanPresets();
    });
    document.body.appendChild(fi);
    fi.click();
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Shared preset application ─────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

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
    // Restore tag and brawl kill data
    if (typeof activeTag !== 'undefined') {
        activeTag = preset.activeTag || null;
        if (typeof brawlCharKills !== 'undefined') {
            brawlCharKills = preset.brawlCharKills || [0,0,0,0,0];
        }
        if (typeof renderTeamTags === 'function') renderTeamTags();
        if (typeof _applyTagEffects === 'function') _applyTagEffects();
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

// ══════════════════════════════════════════════════════════════════════════════
// ── Preset payload builder ────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function _buildPresetPayload(title) {
    return {
        version: 1,
        title,
        slotData, petsData, formationSlots, ultimateRotation,
        slotSkinIndex:   (typeof slotSkinIndex   !== 'undefined' ? slotSkinIndex   : [0,0,0,0,0]),
        bstatDealt:      (typeof bstatDealt       !== 'undefined' ? bstatDealt      : null),
        bstatPrev:       (typeof bstatPrev        !== 'undefined' ? bstatPrev       : null),
        brawlKillCount:  (typeof brawlKillCount   !== 'undefined' ? brawlKillCount  : null),
        activeTag:       (typeof activeTag        !== 'undefined' ? activeTag       : null),
        brawlCharKills:  (typeof brawlCharKills   !== 'undefined' ? brawlCharKills  : [0,0,0,0,0]),
    };
}

// ══════════════════════════════════════════════════════════════════════════════
// ── FSA init (Chrome/Edge) ────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

async function initPresetsFolder() {
    if (!_fsaSupported) return;
    try {
        const root = await window.showDirectoryPicker({ mode: 'readwrite' });
        _presetsDir = await root.getDirectoryHandle('presets', { create: true });
        await scanPresets();
    } catch (e) {
        if (e.name !== 'AbortError') console.warn('Folder access error:', e);
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Scan presets — works for both FSA and IDB modes ───────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

async function scanPresets() {
    const list = document.getElementById('preset-list');
    if (!list) return;

    // ── FSA mode ──────────────────────────────────────────────────────────────
    if (_fsaSupported) {
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
                const files = [];
                for await (const [fname, fhandle] of handle.entries()) {
                    if (fhandle.kind === 'file' && fname.endsWith('.json')) files.push(fname);
                }
                files.sort((a, b) => a.localeCompare(b));
                // ── Hide empty folders ──
                if (files.length > 0) subfolders[name] = files;
            }
        }
        rootFiles.sort((a, b) => a.localeCompare(b));
        _renderPresetList(list, rootFiles, subfolders, false);
        return;
    }

    // ── IDB mode (Firefox) ────────────────────────────────────────────────────
    const { rootFiles, subfolders } = await _idbGetTree();
    // Hide empty folders (shouldn't happen in IDB, but guard anyway)
    const nonEmptySubfolders = {};
    Object.keys(subfolders).forEach(f => { if (subfolders[f].length > 0) nonEmptySubfolders[f] = subfolders[f]; });
    _renderPresetList(list, rootFiles, nonEmptySubfolders, true);
}

// ── Shared list renderer ──────────────────────────────────────────────────────

function _renderPresetList(list, rootFiles, subfolders, isIDB) {
    const totalCount = rootFiles.length + Object.values(subfolders).reduce((s, a) => s + a.length, 0);

    if (totalCount === 0) {
        if (isIDB) {
            list.innerHTML = '<div class="px-3 py-3 text-xs text-slate-500 text-center italic">'
                + 'No presets stored yet.<br>'
                + '<a href="#" onclick="document.getElementById(\'preset-dropdown\').classList.add(\'hidden\');idbSelectFolder();return false;" style="color:#60a5fa;font-size:11px;font-weight:600;">Select presets folder</a>'
                + ' &nbsp;·&nbsp; '
                + '<a href="#" onclick="document.getElementById(\'preset-dropdown\').classList.add(\'hidden\');idbImportFiles();return false;" style="color:#60a5fa;font-size:11px;">Import files</a>'
                + '</div>';
        } else {
            list.innerHTML = '<div class="px-3 py-3 text-xs text-slate-500 text-center italic">No presets found</div>';
        }
        return;
    }

    list.innerHTML = '';

    function makeRow(displayName, onClick) {
        const row = document.createElement('button');
        row.className = 'w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-[#21243a] hover:text-white transition-all flex items-center gap-2 group';
        row.innerHTML = '<i class="fa-solid fa-file-code text-slate-500 group-hover:text-blue-400 flex-shrink-0 transition-colors"></i>'
            + '<span class="truncate">' + displayName + '</span>';
        row.onclick = onClick;
        return row;
    }

    // Root files
    rootFiles.forEach(name => {
        list.appendChild(makeRow(
            name.replace(/\.json$/, '').replace(/_/g, ' '),
            () => isIDB ? _idbLoadPreset(name, null) : loadPresetByName(name, null)
        ));
    });

    // Subfolders (only non-empty ones are passed here)
    const folderNames = Object.keys(subfolders).sort();
    folderNames.forEach(folder => {
        const files = subfolders[folder];
        const header = document.createElement('div');
        header.className = 'px-3 pt-3 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 border-t border-[#2d3142] mt-1';
        header.innerHTML = '<i class="fa-solid fa-folder text-slate-600"></i>' + folder;
        list.appendChild(header);

        files.forEach(name => {
            list.appendChild(makeRow(
                name.replace(/\.json$/, '').replace(/_/g, ' '),
                () => isIDB ? _idbLoadPreset(name, folder) : loadPresetByName(name, folder)
            ));
        });
    });

    // IDB: add Import buttons at bottom
    if (isIDB) {
        const sep = document.createElement('div');
        sep.className = 'border-t border-[#2d3142] mt-1 pt-1';

        const folderBtn = document.createElement('button');
        folderBtn.className = 'w-full text-left px-3 py-2 text-xs text-blue-400 hover:bg-[#0c1626] hover:text-blue-300 transition-all flex items-center gap-2';
        folderBtn.innerHTML = '<i class="fa-solid fa-folder-open text-blue-500 flex-shrink-0"></i><span>Select presets folder…</span>';
        folderBtn.onclick = () => { document.getElementById('preset-dropdown').classList.add('hidden'); idbSelectFolder(); };
        sep.appendChild(folderBtn);

        const filesBtn = document.createElement('button');
        filesBtn.className = 'w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-[#21243a] hover:text-slate-300 transition-all flex items-center gap-2';
        filesBtn.innerHTML = '<i class="fa-solid fa-file-import text-slate-500 flex-shrink-0"></i><span>Import individual .json files…</span>';
        filesBtn.onclick = () => { document.getElementById('preset-dropdown').classList.add('hidden'); idbImportFiles(); };
        sep.appendChild(filesBtn);

        list.appendChild(sep);
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Filename helpers ──────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

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

// ══════════════════════════════════════════════════════════════════════════════
// ── Save preset ───────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

async function savePreset() {
    _pendingSaveTitle = document.querySelector('h1[contenteditable]')?.innerText?.trim() || 'My Lost Sword Team';

    // ── FSA mode (Chrome/Edge) ────────────────────────────────────────────────
    if (_fsaSupported) {
        if (!_presetsDir) {
            await initPresetsFolder();
            if (!_presetsDir) return;
        }
        await _showSubfolderModal(false);
        return;
    }

    // ── IDB mode (Firefox) ────────────────────────────────────────────────────
    await _showSubfolderModal(true);
}

// ── Show subfolder-modal, populated for FSA or IDB mode ──────────────────────

async function _showSubfolderModal(isIDB) {
    const subfolderList = document.getElementById('subfolder-list');
    subfolderList.innerHTML = '<div class="px-3 py-3 text-xs text-slate-500 text-center italic">Scanning folders...</div>';

    let folders = [];

    if (isIDB) {
        const { subfolders } = await _idbGetTree();
        folders = Object.keys(subfolders).sort();
    } else {
        for await (const [name, handle] of _presetsDir.entries()) {
            if (handle.kind === 'directory') folders.push(name);
        }
        folders.sort((a, b) => a.localeCompare(b));
    }

    subfolderList.innerHTML = '';

    if (folders.length === 0) {
        subfolderList.innerHTML = '<div class="px-3 py-3 text-[11px] text-slate-500 text-center italic">'
            + 'No subfolders yet.<br>'
            + (isIDB
                ? 'Type a folder name in the "New folder" field below, or save to root.'
                : 'Create subfolders in your file system to organise saves.')
            + '</div>';
    } else {
        folders.forEach(name => {
            const btn = document.createElement('button');
            btn.className = 'w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-[#21243a] hover:text-white transition-all flex items-center gap-3 group rounded-lg';
            btn.innerHTML = `<i class="fa-solid fa-folder text-yellow-500/70 group-hover:text-yellow-400 text-base flex-shrink-0 transition-colors"></i>
                <span class="flex-1 truncate font-medium">${name}</span>
                <i class="fa-solid fa-chevron-right text-slate-600 group-hover:text-slate-400 text-xs transition-colors"></i>`;
            btn.onclick = () => confirmSaveToFolder(name);
            subfolderList.appendChild(btn);
        });
    }

    // ── IDB extra: "New folder" text input ───────────────────────────────────
    if (isIDB) {
        const newFolderWrap = document.createElement('div');
        newFolderWrap.className = 'px-4 pt-2 pb-1';
        newFolderWrap.innerHTML = `
            <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;margin-bottom:6px;">New Folder</div>
            <div style="display:flex;gap:6px;">
                <input id="idb-new-folder-input" type="text" placeholder="e.g. Fenrir, Avalon…"
                    style="flex:1;background:#111218;border:1px solid #2d3142;border-radius:6px;
                           padding:6px 10px;font-size:12px;color:#e2e8f0;outline:none;"
                    onfocus="this.style.borderColor='#4b6bfb'" onblur="this.style.borderColor='#2d3142'">
                <button onclick="idbSaveToNewFolder()"
                    style="background:#1a1e2e;border:1px solid #4b6bfb;border-radius:6px;
                           padding:6px 12px;font-size:11px;font-weight:700;color:#60a5fa;cursor:pointer;
                           white-space:nowrap;transition:all 0.15s;"
                    onmouseover="this.style.background='#1e2240'" onmouseout="this.style.background='#1a1e2e'">Save here</button>
            </div>`;
        subfolderList.appendChild(newFolderWrap);
    }

    updateSavePreview(folders.length > 0 ? folders[0] : null);
    // Tag the modal so confirmSaveToFolder knows which backend to use
    document.getElementById('subfolder-modal').dataset.idb = isIDB ? '1' : '0';
    document.getElementById('subfolder-modal').classList.remove('hidden');
}

function idbSaveToNewFolder() {
    const input = document.getElementById('idb-new-folder-input');
    const name  = input ? input.value.trim() : '';
    if (!name) { input && input.focus(); return; }
    confirmSaveToFolder(name);
}

function updateSavePreview(subfolderName) {
    const filename = buildFilename(subfolderName);
    const path = subfolderName ? `presets/${subfolderName}/${filename}` : `presets/${filename}`;
    document.getElementById('subfolder-preview').textContent = path;
}

function closeSubfolderModal() {
    document.getElementById('subfolder-modal').classList.add('hidden');
}

// ── confirmSaveToFolder: routes to FSA or IDB based on modal tag ──────────────

async function confirmSaveToFolder(subfolderName) {
    const isIDB = document.getElementById('subfolder-modal')?.dataset?.idb === '1';
    closeSubfolderModal();

    const filename = buildFilename(subfolderName);
    const json     = JSON.stringify(_buildPresetPayload(_pendingSaveTitle), null, 2);

    if (isIDB) {
        // ── IDB save ────────────────────────────────────────────────────────
        const key = subfolderName ? subfolderName + '/' + filename : filename;
        const existing = await _idbGet(key);
        if (existing && !confirm(`"${filename}" already exists.\nOverwrite it?`)) return;
        await _idbPut(key, json);
        await scanPresets();

        // Also offer a download copy
        _downloadPreset(json, filename);
        _flashSaveButton('Saved!');

    } else {
        // ── FSA save ────────────────────────────────────────────────────────
        if (!_presetsDir) return;
        let targetDir = _presetsDir;
        if (subfolderName) targetDir = await _presetsDir.getDirectoryHandle(subfolderName, { create: true });
        let exists = false;
        try { await targetDir.getFileHandle(filename); exists = true; } catch (_) {}
        if (exists && !confirm(`"${filename}" already exists.\nOverwrite it?`)) return;
        const fh = await targetDir.getFileHandle(filename, { create: true });
        const writable = await fh.createWritable();
        await writable.write(json);
        await writable.close();
        await scanPresets();
        _flashSaveButton('Saved!');
    }
}

function _downloadPreset(json, filename) {
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function _flashSaveButton(label) {
    const btn = document.querySelector('[onclick="savePreset()"]');
    if (!btn) return;
    const orig = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-check mr-2"></i>${label}`;
    btn.classList.replace('text-blue-400', 'text-green-400');
    btn.classList.replace('border-blue-700', 'border-green-700');
    setTimeout(() => {
        btn.innerHTML = orig;
        btn.classList.replace('text-green-400', 'text-blue-400');
        btn.classList.replace('border-green-700', 'border-blue-700');
    }, 1800);
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Load preset ───────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

// FSA mode
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

// IDB mode
async function _idbLoadPreset(filename, subfolderName) {
    const key = subfolderName ? subfolderName + '/' + filename : filename;
    try {
        const text = await _idbGet(key);
        if (!text) { alert('Preset not found: ' + key); return; }
        _applyPreset(JSON.parse(text));
    } catch (e) {
        alert('Failed to load preset: ' + e.message);
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Dropdown toggle ───────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function togglePresetDropdown(e) {
    e.stopPropagation();
    const dd = document.getElementById('preset-dropdown');
    const wasHidden = dd.classList.contains('hidden');
    if (_fsaSupported && !_presetsDir) {
        // Chrome/Edge: need to grant access first
        initPresetsFolder().then(() => {
            if (_presetsDir) {
                dd.classList.remove('hidden');
                scanPresets();
            }
        });
        return;
    }
    dd.classList.toggle('hidden');
    if (wasHidden) scanPresets();
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Event listeners ───────────────────────────────────────════════════════════
// ══════════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
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
