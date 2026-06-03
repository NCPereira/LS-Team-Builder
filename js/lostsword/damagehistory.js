// ── damagehistory.js ──────────────────────────────────────────────────────────
// Damage History timeline graph: folder scanning, preset parsing, canvas render.
// Depends on: _presetsDir (presets.js)

(function () {
    let _dtgSubfolderHandle = null; // the chosen subfolder handle
    let _dtgSubfolderName   = '';

    // ── Dropdown toggle ────────────────────────────────────────────────────────

    window.toggleDtgDropdown = function (e) {
        e.stopPropagation();
        const dd = document.getElementById('dtg-dropdown');
        const wasHidden = dd.classList.contains('hidden');
        dd.classList.toggle('hidden');
        if (wasHidden) dtgScanFolders();
    };

    // Close on outside click
    document.addEventListener('click', function (e) {
        const dd = document.getElementById('dtg-dropdown');
        if (!dd || dd.classList.contains('hidden')) return;
        if (!dd.closest('.relative').contains(e.target)) dd.classList.add('hidden');
    });

    // ── Scan _presetsDir for subfolders ───────────────────────────────────────

    window.dtgScanFolders = async function () {
        const list = document.getElementById('dtg-folder-list');
        if (!list) return;

        if (typeof _presetsDir === 'undefined' || !_presetsDir) {
            list.innerHTML = '<div class="px-3 py-3 text-xs text-slate-500 text-center italic">Grant folder access first</div>';
            return;
        }

        list.innerHTML = '<div class="px-3 py-3 text-xs text-slate-500 text-center italic">Scanning…</div>';

        const folders = [];
        try {
            for await (const [name, handle] of _presetsDir.entries()) {
                if (handle.kind === 'directory') folders.push({ name, handle });
            }
        } catch (e) {
            list.innerHTML = '<div class="px-3 py-3 text-xs text-slate-500 text-center italic">Error reading folders</div>';
            return;
        }

        folders.sort((a, b) => a.name.localeCompare(b.name));

        if (folders.length === 0) {
            list.innerHTML = '<div class="px-3 py-3 text-xs text-slate-500 text-center italic">No subfolders found</div>';
            return;
        }

        list.innerHTML = '';
        folders.forEach(({ name, handle }) => {
            const row = document.createElement('button');
            row.className = 'w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-[#21243a] hover:text-white transition-all flex items-center gap-2 group';
            row.innerHTML = `<i class="fa-solid fa-folder text-yellow-500/70 group-hover:text-yellow-400 flex-shrink-0 transition-colors"></i><span class="truncate">${name}</span>`;
            row.onclick = () => {
                _dtgSubfolderHandle = handle;
                _dtgSubfolderName   = name;
                document.getElementById('dtg-folder-label').textContent = '/ ' + name;
                document.getElementById('dtg-refresh-btn').classList.remove('hidden');
                document.getElementById('dtg-dropdown').classList.add('hidden');
                dtgLoad();
            };
            list.appendChild(row);
        });
    };

    // ── Load & parse presets from selected subfolder ──────────────────────────

    window.dtgLoad = async function () {
        if (!_dtgSubfolderHandle) return;

        const countLabel = document.getElementById('dtg-count-label');
        countLabel.textContent = 'Loading…';

        const entries = [];
        try {
            for await (const [name, handle] of _dtgSubfolderHandle.entries()) {
                if (handle.kind === 'file' && name.endsWith('.json')) {
                    entries.push({ name, handle });
                }
            }
        } catch (e) {
            countLabel.textContent = 'Error reading folder';
            return;
        }

        entries.sort((a, b) => a.name.localeCompare(b.name));
        const slice = entries.slice(-10);

        const dataPoints = [];
        for (const { name, handle } of slice) {
            try {
                const text = await (await handle.getFile()).text();
                const preset = JSON.parse(text);
                const rows = preset.bstatDealt;
                if (!rows || !Array.isArray(rows)) continue;
                const total = rows.reduce((s, r) => s + (r.value || 0), 0);
                if (total <= 0) continue;
                const dm = name.match(/(\d{4}-\d{2}-\d{2})/);
                const dateStr = dm ? dm[1] : name.replace('.json', '');
                dataPoints.push({ date: dateStr, total, title: preset.title || name.replace('.json', '') });
            } catch (_) {}
        }

        const n = dataPoints.length;
        countLabel.textContent = n > 0
            ? `${n} preset${n !== 1 ? 's' : ''} loaded`
            : 'No damage data found';

        dtgRender(dataPoints);
    };

    // ── Raid boss folder whitelist ─────────────────────────────────────────────

    const RAID_FOLDERS = new Set([
        'fenrir', 'vivien', 'morganphysical', 'morganwizard',
        'morrigan', 'estheria', 'chimera', 'jormungandr',
        'Fenrir', 'Vivien', 'MorganPhysical', 'MorganWizard',
        'Morrigan', 'Estheria', 'Chimera', 'Jormumgandr'
    ]);

    function isRaidFolder(name) {
        return RAID_FOLDERS.has(name) || RAID_FOLDERS.has(name.toLowerCase());
    }

    // ── Load most recent score from each raid folder ───────────────────────────

    window.dtgLoadAllRaids = async function () {
        if (typeof _presetsDir === 'undefined' || !_presetsDir) {
            alert('Grant folder access first — click Select Folder.');
            return;
        }

        const countLabel = document.getElementById('dtg-count-label');
        countLabel.textContent = 'Loading all raids…';
        document.getElementById('dtg-folder-label').textContent = '/ All Raids';

        const dataPoints = [];

        try {
            for await (const [folderName, folderHandle] of _presetsDir.entries()) {
                if (folderHandle.kind !== 'directory') continue;
                if (!isRaidFolder(folderName)) continue;

                const files = [];
                for await (const [fname, fh] of folderHandle.entries()) {
                    if (fh.kind === 'file' && fname.endsWith('.json')) files.push({ name: fname, handle: fh });
                }
                if (files.length === 0) continue;
                files.sort((a, b) => a.name.localeCompare(b.name));
                const latest = files[files.length - 1];
                try {
                    const text = await (await latest.handle.getFile()).text();
                    const preset = JSON.parse(text);
                    const rows = preset.bstatDealt;
                    if (!rows || !Array.isArray(rows)) continue;
                    const total = rows.reduce((s, r) => s + (r.value || 0), 0);
                    if (total <= 0) continue;
                    const displayName = folderName.replace(/([a-z])([A-Z])/g, '$1 $2');
                    dataPoints.push({ date: displayName, total, title: displayName });
                } catch (_) {}
            }
        } catch (e) {
            countLabel.textContent = 'Error reading folders';
            return;
        }

        dataPoints.sort((a, b) => b.total - a.total);

        const n = dataPoints.length;
        countLabel.textContent = n > 0
            ? `${n} raid${n !== 1 ? 's' : ''} loaded`
            : 'No raid data found';

        dtgRender(dataPoints);
    };

    // Show All Raids button once folder access is granted (check periodically)
    const _allRaidsWatcher = setInterval(() => {
        if (typeof _presetsDir !== 'undefined' && _presetsDir) {
            document.getElementById('dtg-all-raids-btn')?.classList.remove('hidden');
            clearInterval(_allRaidsWatcher);
        }
    }, 500);

    // ── Render canvas ──────────────────────────────────────────────────────────

    function dtgRender(pts) {
        const canvas = document.getElementById('dtg-canvas');
        const ph     = document.getElementById('dtg-placeholder');
        const ctx    = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;

        ctx.clearRect(0, 0, W, H);

        if (!pts || pts.length === 0) {
            ph.style.display = 'flex';
            return;
        }
        ph.style.display = 'none';

        // ── Layout constants ──
        const padL = 95, padR = 30, padT = 38, padB = 40;
        const cW = W - padL - padR;
        const cH = H - padT - padB;

        // ── Nice Y-axis max ──
        const rawMax  = Math.max(...pts.map(d => d.total));
        const niceMax = niceUp(rawMax * 1.08);
        const tickCount = 8;
        const tickStep  = niceMax / tickCount;

        // ── Coordinate helpers ──
        const colW = cW / pts.length;
        const barW = Math.min(Math.max(colW * 0.55, 8), 100);
        const xPos = i => padL + colW * (i + 0.5);
        const yPos = v => padT + cH - (v / niceMax) * cH;

        // ── Subtle horizontal grid ──
        for (let t = 0; t <= tickCount; t++) {
            const y = padT + cH - (t / tickCount) * cH;
            ctx.strokeStyle = t === 0
                ? 'rgba(0,200,220,0.12)'
                : 'rgba(255,255,255,0.035)';
            ctx.lineWidth = 1;
            ctx.setLineDash(t > 0 ? [4, 6] : []);
            ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + cW, y); ctx.stroke();
        }
        ctx.setLineDash([]);

        // ── Vertical dotted guide lines ──
        ctx.strokeStyle = 'rgba(255,255,255,0.025)';
        ctx.lineWidth = 1;
        pts.forEach((_, i) => {
            const x = xPos(i);
            ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + cH); ctx.stroke();
        });

        // ── Bars ──
        pts.forEach((d, i) => {
            const x  = xPos(i);
            const bH = (d.total / niceMax) * cH;
            const by = padT + cH - bH;
            const bx = x - barW / 2;

            const grd = ctx.createLinearGradient(x, by, x, padT + cH);
            grd.addColorStop(0,   'rgba(0,230,230,0.88)');
            grd.addColorStop(0.4, 'rgba(0,190,210,0.65)');
            grd.addColorStop(0.8, 'rgba(0,130,170,0.35)');
            grd.addColorStop(1,   'rgba(0, 80,130,0.10)');

            ctx.shadowColor = 'rgba(0,220,220,0.55)';
            ctx.shadowBlur  = 16;
            ctx.fillStyle   = grd;

            const r = Math.min(4, barW / 4);
            ctx.beginPath();
            ctx.moveTo(bx + r, by);
            ctx.lineTo(bx + barW - r, by);
            ctx.quadraticCurveTo(bx + barW, by, bx + barW, by + r);
            ctx.lineTo(bx + barW, padT + cH);
            ctx.lineTo(bx, padT + cH);
            ctx.lineTo(bx, by + r);
            ctx.quadraticCurveTo(bx, by, bx + r, by);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.strokeStyle = 'rgba(0,240,240,0.55)';
            ctx.lineWidth   = 1.5;
            ctx.beginPath();
            ctx.moveTo(bx + r, by);
            ctx.lineTo(bx + barW - r, by);
            ctx.stroke();
        });

        // ── Line ──
        if (pts.length > 1) {
            ctx.shadowColor = 'rgba(120,175,255,0.9)';
            ctx.shadowBlur  = 10;
            ctx.strokeStyle = 'rgba(140,185,255,0.75)';
            ctx.lineWidth   = 2.5;
            ctx.lineJoin    = 'round';
            ctx.beginPath();
            pts.forEach((d, i) => {
                const x = xPos(i), y = yPos(d.total);
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            });
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // ── Dots + value labels ──
        pts.forEach((d, i) => {
            const x = xPos(i), y = yPos(d.total);
            const isMax = d.total === rawMax;

            const haloGrd = ctx.createRadialGradient(x, y, 0, x, y, 12);
            haloGrd.addColorStop(0, isMax ? 'rgba(255,80,80,0.40)' : 'rgba(120,175,255,0.30)');
            haloGrd.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = haloGrd;
            ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.fill();

            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fillStyle   = isMax ? '#ff6060' : '#90bdff';
            ctx.shadowColor = isMax ? 'rgba(255,80,80,0.9)' : 'rgba(140,190,255,0.9)';
            ctx.shadowBlur  = 10;
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth   = 1.5;
            ctx.stroke();
            ctx.shadowBlur  = 0;

            const lbl = fmtNum(d.total);
            ctx.font        = 'bold 13px system-ui,sans-serif';
            ctx.textAlign   = 'center';
            ctx.shadowColor = 'rgba(0,0,0,1)';
            ctx.shadowBlur  = 6;
            ctx.fillStyle   = isMax ? '#ffb0b0' : '#e8f2ff';
            ctx.fillText(lbl, x, y - 14);
            ctx.shadowBlur  = 0;
        });

        // ── Y-axis labels ──
        ctx.textAlign = 'right';
        ctx.font      = 'bold 12px system-ui,sans-serif';
        for (let t = 0; t <= tickCount; t++) {
            const val = t * tickStep;
            const y   = padT + cH - (t / tickCount) * cH;
            ctx.fillStyle   = '#c8d8f0';
            ctx.shadowColor = 'rgba(0,0,0,0.95)';
            ctx.shadowBlur  = 4;
            ctx.fillText(fmtNum(val), padL - 8, y + 4);
            ctx.shadowBlur  = 0;
        }

        // ── X-axis date labels ──
        ctx.textAlign = 'center';
        pts.forEach((d, i) => {
            const x = xPos(i);
            const parts = d.date.split('-');
            const md = parts.length === 3 ? parts[1] + '/' + parts[2] : d.date;
            const yr = parts.length === 3 ? parts[0] : '';
            ctx.shadowColor = 'rgba(0,0,0,0.95)';
            ctx.shadowBlur  = 4;
            ctx.fillStyle   = '#e2eeff';
            ctx.font        = 'bold 13px system-ui,sans-serif';
            ctx.fillText(md, x, padT + cH + 16);
            if (yr) {
                ctx.fillStyle = '#7a90aa';
                ctx.font      = 'bold 11px system-ui,sans-serif';
                ctx.fillText(yr, x, padT + cH + 30);
            }
            ctx.shadowBlur = 0;
        });

        // ── Y-axis title (rotated) ──
        ctx.save();
        ctx.translate(13, padT + cH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle   = '#64748b';
        ctx.font        = 'bold 10px system-ui,sans-serif';
        ctx.textAlign   = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur  = 3;
        ctx.fillText('DAMAGE DEALT', 0, 0);
        ctx.shadowBlur  = 0;
        ctx.restore();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    function fmtNum(n) {
        if (n >= 1e9) return (n / 1e9).toFixed(2).replace(/\.?0+$/, '') + 'B';
        if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
        if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
        return String(n);
    }

    function niceUp(v) {
        if (v <= 0) return 1;
        const mag  = Math.pow(10, Math.floor(Math.log10(v)));
        const frac = v / mag;
        let nice;
        if      (frac <= 1) nice = 1;
        else if (frac <= 2) nice = 2;
        else if (frac <= 5) nice = 5;
        else                nice = 10;
        return nice * mag;
    }

})();
