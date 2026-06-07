// ── battlestats.js ────────────────────────────────────────────────────────────
// Battle Stats panel: image upload, clipboard paste, 7-pass Tesseract OCR,
// consensus voting, bar chart rendering, and clear/update helpers.
// Depends on: slotData, db, getCharInfo, getFacePosition (index.html)

// ── State ─────────────────────────────────────────────────────────────────────

let bstatDealt = null;   // current scores
let bstatPrev  = null;   // snapshot before last "Update Score"
let bstatUpdateMode = false; // true while waiting for new image after clicking Update

// ── Upload zone setup (runs after DOM ready) ───────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    const uploadZone = document.getElementById('battle-stats-upload-zone');
    const fileInput  = document.getElementById('battle-stats-file');
    const bstatPanel = document.getElementById('battle-stats-panel');
    const pasteBtn   = document.getElementById('battle-stats-paste-btn');

    uploadZone.addEventListener('click', () => fileInput.click());
    uploadZone.addEventListener('dragover',  e => { e.preventDefault(); e.stopPropagation(); uploadZone.classList.add('dragover'); });
    uploadZone.addEventListener('dragleave', e => { e.stopPropagation(); uploadZone.classList.remove('dragover'); });
    uploadZone.addEventListener('drop', e => {
        e.preventDefault(); e.stopPropagation();
        uploadZone.classList.remove('dragover');
        const file = [...(e.dataTransfer.files || [])].find(f => f.type.startsWith('image/'));
        if (file) processBStatImage(file);
    });

    // Catch drops anywhere on the panel
    bstatPanel.addEventListener('dragover', e => { e.preventDefault(); e.stopPropagation(); });
    bstatPanel.addEventListener('drop', e => {
        e.preventDefault(); e.stopPropagation();
        const file = [...(e.dataTransfer.files || [])].find(f => f.type.startsWith('image/'));
        if (file) processBStatImage(file);
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files[0]) processBStatImage(fileInput.files[0]);
        fileInput.value = '';
    });

    // Paste button hover styles
    pasteBtn.addEventListener('mouseenter', () => { pasteBtn.style.borderColor = '#4b6bfb'; pasteBtn.style.background = '#1e2240'; });
    pasteBtn.addEventListener('mouseleave', () => { pasteBtn.style.borderColor = '#2d3142'; pasteBtn.style.background = '#20222f'; });
});

// Global Ctrl+V fallback
document.addEventListener('paste', e => {
    const img = [...(e.clipboardData?.items || [])].find(i => i.type.startsWith('image/'));
    if (img) { e.preventDefault(); processBStatImage(img.getAsFile()); }
});

// ── Clipboard paste ────────────────────────────────────────────────────────────

async function pasteFromClipboard() {
    try {
        const items = await navigator.clipboard.read();
        for (const item of items) {
            const t = item.types.find(t => t.startsWith('image/'));
            if (t) { processBStatImage(new File([await item.getType(t)], 'clipboard.png', { type: t })); return; }
        }
        setStatus('No image in clipboard — try Ctrl+V');
    } catch { setStatus('Press Ctrl+V anywhere on the page to paste'); }
}

// ── "Update Score" — snapshot current data then show upload UI ─────────────────

function beginUpdateScore() {
    if (!bstatDealt) return;
    bstatUpdateMode = true;
    const uploadRow = document.getElementById('bstat-upload-row');
    if (uploadRow) uploadRow.classList.remove('hidden');
    setStatus('Upload/paste new screenshot to update…');
    document.getElementById('battle-stats-update').classList.add('hidden');
}

// ── Main processing pipeline — 7-pass directional OCR ─────────────────────────

async function processBStatImage(file) {
    setStatus('Reading image…');
    try {
        const bitmap = await createImageBitmap(file);
        const W = bitmap.width, H = bitmap.height;

        // ── Shared grayscale + contrast helper ──
        function applyGray(cx, w, h, threshold, mult) {
            const id = cx.getImageData(0, 0, w, h);
            const d  = id.data;
            for (let i = 0; i < d.length; i += 4) {
                const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
                const b = Math.min(255, Math.max(0, (g - threshold) * mult));
                d[i] = d[i + 1] = d[i + 2] = b;
            }
            cx.putImageData(id, 0, 0);
        }

        // ── Inverted grayscale helper ──
        function applyGrayInverted(cx, w, h) {
            const id = cx.getImageData(0, 0, w, h);
            const d  = id.data;
            for (let i = 0; i < d.length; i += 4) {
                const g   = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
                const inv = 255 - g;
                const b   = Math.min(255, Math.max(0, (inv - 40) * 1.8));
                d[i] = d[i + 1] = d[i + 2] = b;
            }
            cx.putImageData(id, 0, 0);
        }

        // ── Generic canvas builder ──
        function buildCanvas(angle, flipX, flipY, threshold, mult, inverted) {
            const TARGET = 1600;
            const rotated90 = Math.abs(Math.round(angle / (Math.PI / 2))) % 2 === 1;
            const baseScale = rotated90 ? Math.max(1, TARGET / H) : Math.max(1, TARGET / W);
            const sw = Math.round(W * baseScale);
            const sh = Math.round(H * baseScale);
            const outW = rotated90 ? sh : sw;
            const outH = rotated90 ? sw : sh;
            const c  = document.createElement('canvas');
            c.width  = outW;
            c.height = outH;
            const cx = c.getContext('2d');
            cx.save();
            cx.translate(outW / 2, outH / 2);
            if (flipX) cx.scale(-1,  1);
            if (flipY) cx.scale( 1, -1);
            cx.rotate(angle);
            cx.drawImage(bitmap, 0, 0, W, H, -sw / 2, -sh / 2, sw, sh);
            cx.restore();
            cx.setTransform(1, 0, 0, 1, 0, 0);
            if (inverted) applyGrayInverted(cx, outW, outH);
            else          applyGray(cx, outW, outH, threshold, mult);
            return c;
        }

        const ocrOpts = { tessedit_char_whitelist: '0123456789., ', tessedit_pageseg_mode: '6' };

        setStatus('Running OCR (1/7 — normal)…');
        const r1 = await Tesseract.recognize(buildCanvas(0,          false, false, 50,  1.6, false), 'eng', ocrOpts);

        setStatus('Running OCR (2/7 — high contrast)…');
        const r2 = await Tesseract.recognize(buildCanvas(0,          false, false, 30,  2.4, false), 'eng', ocrOpts);

        setStatus('Running OCR (3/7 — inverted)…');
        const r3 = await Tesseract.recognize(buildCanvas(0,          false, false, 0,   1.0, true),  'eng', ocrOpts);

        setStatus('Running OCR (4/7 — bottom→top, 180°)…');
        const r4 = await Tesseract.recognize(buildCanvas(Math.PI,    false, false, 35,  2.0, false), 'eng', ocrOpts);

        setStatus('Running OCR (5/7 — left→right, 90° CW)…');
        const r5 = await Tesseract.recognize(buildCanvas(Math.PI / 2,  false, false, 40, 1.8, false), 'eng', ocrOpts);

        setStatus('Running OCR (6/7 — right→left, 90° CCW)…');
        const r6 = await Tesseract.recognize(buildCanvas(-Math.PI / 2, false, false, 40, 1.8, false), 'eng', ocrOpts);

        setStatus('Running OCR (7/7 — bottom→top, vertical flip)…');
        const r7 = await Tesseract.recognize(buildCanvas(0,          false, true,  35,  2.0, false), 'eng', ocrOpts);

        const allResults = [r1, r2, r3, r4, r5, r6, r7];
        allResults.forEach((r, i) => console.log(`[BStats P${i + 1}]`, r.data.text));

        // ── Number extraction ──
        function extractNums(text) {
            const seen = new Set();
            const out  = [];
            let m;

            function addVal(raw) {
                if (raw.length < 4 || raw.length > 13) return;
                const val = parseInt(raw, 10);
                if (val >= 1000 && !seen.has(val)) { seen.add(val); out.push(val); }
            }

            // Space-separated: "100 148 693" / "2 622 510 896"
            const reSpace = /(?<![.\d])\d{1,3}(?: \d{3}){1,4}(?![.\d])/g;
            while ((m = reSpace.exec(text)) !== null) addVal(m[0].replace(/ /g, ''));

            // Dot-separated: 243.351.969 / 11.379.954.002
            const reDotMulti = /(?<![,\d])\d{1,3}(?:\.\d{3})+(?![.\d])/g;
            while ((m = reDotMulti.exec(text)) !== null) {
                const parts = m[0].split('.');
                if (parts.length === 2 && parts[1].length !== 3) continue;
                addVal(m[0].replace(/\./g, ''));
            }

            // Comma-separated: 4,555,615,886
            const reComma = /(?<![.\d])\d{1,3}(?:,\d{3}){1,4}(?![.\d])/g;
            while ((m = reComma.exec(text)) !== null) addVal(m[0].replace(/,/g, ''));

            // Plain digit runs
            const rePlain = /(?<![.,\d ])\d{7,13}(?![.,\d])/g;
            while ((m = rePlain.exec(text)) !== null) addVal(m[0]);

            return out;
        }

        // ── Percentage extraction ──
        function extractPcts(text) {
            const out = [];
            let m;
            const reComma = /(?<!\d)\d{1,2},\d{2}(?!\d)/g;
            while ((m = reComma.exec(text)) !== null) {
                const v = parseFloat(m[0].replace(',', '.'));
                if (v >= 0.01 && v <= 100) out.push(v);
            }
            const reDot = /(?<!\d)\d{1,2}\.\d{2}(?!\d)/g;
            while ((m = reDot.exec(text)) !== null) {
                const v = parseFloat(m[0]);
                if (v >= 0.01 && v <= 100) out.push(v);
            }
            return out;
        }

        // ── Detect zero-damage rows with positional context ──
        function extractPositionalSequence(text) {
            const lines = text.split(/[\n\r]+/);
            const seq = [];
            const reNum = /(?:\d{1,3}[. ]\d{3}[. ]\d{3}(?:[. ]\d{3})?|\d{1,3},\d{3},\d{3}(?:,\d{3})?|\d{7,13})/;
            let i = 0;
            while (i < lines.length) {
                const line = lines[i];
                const isZeroRow = /(?:^|[\s])0(?=[\s]|$)/.test(line) &&
                                  (lines.slice(Math.max(0, i - 2), i + 3).join(' ').match(/\b0[,.]00\b/));
                if (isZeroRow) { seq.push(0); i++; continue; }
                const numMatch = line.match(reNum);
                if (numMatch) {
                    const cleaned = numMatch[0].replace(/[,. ]/g, '');
                    const val = parseInt(cleaned, 10);
                    if (!isNaN(val) && val >= 1000) { seq.push(val); i++; continue; }
                }
                i++;
            }
            return seq;
        }

        const positionalSeqs = [
            extractPositionalSequence(r1.data.text),
            extractPositionalSequence(r2.data.text),
            extractPositionalSequence(r3.data.text),
        ].filter(s => s.length >= 1 && s.length <= 5);

        const bestSeq = positionalSeqs.length > 0
            ? positionalSeqs.reduce((best, cur) => cur.length >= best.length ? cur : best, positionalSeqs[0])
            : [];

        function countZeroRows(text) {
            const zerosPct = (text.match(/\b0[,.]00\b/g) || []).length;
            const zerosNum = (text.match(/(?:^|[\n\r\s])0(?=[\s\n\r]|$)/gm) || []).length;
            return Math.max(zerosPct, zerosNum);
        }

        const zeroVotes  = allResults.map(r => countZeroRows(r.data.text));
        const sortedZV   = [...zeroVotes].sort((a, b) => a - b);
        const zeroRowCount = sortedZV[Math.floor(sortedZV.length / 2)];
        const nonZeroSlots = Math.max(1, Math.min(5, 5 - zeroRowCount));

        console.log('[BStats] zero-row votes:', zeroVotes, '→ median:', zeroRowCount, '→ nonZeroSlots:', nonZeroSlots, '→ bestSeq:', bestSeq);

        // ── Normalise orientations before voting ──
        const numsPerPass = [
            extractNums(r1.data.text),
            extractNums(r2.data.text),
            extractNums(r3.data.text),
            extractNums(r4.data.text).reverse(),
            extractNums(r5.data.text),
            extractNums(r6.data.text),
            extractNums(r7.data.text).reverse(),
        ];
        const pctsPerPass = allResults.map(r => extractPcts(r.data.text));

        // ── Consensus voting ──
        const numVotes = new Map();
        numsPerPass.forEach(nums => {
            const seen = new Set();
            nums.forEach(v => {
                if (!seen.has(v)) { seen.add(v); numVotes.set(v, (numVotes.get(v) || 0) + 1); }
            });
        });

        let candidates = [...numVotes.entries()]
            .sort((a, b) => b[1] - a[1] || b[0] - a[0])
            .map(([v]) => v);

        const topN = candidates.slice(0, nonZeroSlots);

        // Restore top→bottom display order
        const vertPasses  = [numsPerPass[0], numsPerPass[1], numsPerPass[2]];
        const orderedNums = vertPasses.reduce((best, cur) => cur.length > best.length ? cur : best, []);

        topN.sort((a, b) => {
            const ia = orderedNums.indexOf(a);
            const ib = orderedNums.indexOf(b);
            if (ia === -1 && ib === -1) return b - a;
            if (ia === -1) return 1;
            if (ib === -1) return -1;
            return ia - ib;
        });

        const pctsBestPass = pctsPerPass.reduce((best, cur) => cur.length > best.length ? cur : best, []);
        const seenP = new Set();
        const allPcts = pctsBestPass.filter(v => { if (seenP.has(v)) return false; seenP.add(v); return true; });

        console.log('[BStats] topN:', topN, '| pcts:', allPcts, '| votes:', Object.fromEntries(numVotes));

        if (topN.length === 0) {
            setStatus('Could not read numbers — ensure "Damage Dealt" tab is visible');
            return;
        }

        // ── Build 5 positional rows ──
        let positionalValues;

        const seqNonZero   = bestSeq.filter(v => v > 0);
        const topNSet      = new Set(topN);
        const seqMatchCount = seqNonZero.filter(v => topNSet.has(v)).length;
        const seqIsReliable = bestSeq.length >= 2 && seqMatchCount >= Math.min(seqNonZero.length, topN.length);

        if (seqIsReliable && bestSeq.length <= 5) {
            let topNIdx = 0;
            const mapped = bestSeq.map(v => {
                if (v === 0) return 0;
                return topN[topNIdx++] ?? v;
            });
            while (mapped.length < 5) mapped.push(0);
            positionalValues = mapped.slice(0, 5);
        } else {
            positionalValues = Array.from({ length: 5 }, (_, i) => topN[i] ?? 0);
        }

        const total = positionalValues.reduce((s, v) => s + v, 0);

        const nonZeroPositions = positionalValues.map((v, i) => v > 0 ? i : -1).filter(i => i !== -1);
        const pctSum = allPcts.slice(0, nonZeroPositions.length).reduce((s, v) => s + v, 0);
        const usePcts = allPcts.length >= nonZeroPositions.length && Math.abs(pctSum - 100) < 5;
        let pctIdx = 0;

        const rows = Array.from({ length: 5 }, (_, i) => {
            const value = positionalValues[i];
            let pct = 0;
            if (value > 0) {
                pct = usePcts
                    ? (allPcts[pctIdx++] ?? (total > 0 ? value / total * 100 : 0))
                    : (total > 0 ? value / total * 100 : 0);
            }
            return { slot: i + 1, value, pct };
        });

        if (bstatUpdateMode && bstatDealt) {
            bstatPrev = bstatDealt.map(r => ({ ...r }));
            bstatDealt = rows;
            bstatUpdateMode = false;
        } else {
            bstatPrev  = null;
            bstatDealt = rows;
        }

        renderBStatBars();
        setStatus('Done ✓');
        setTimeout(() => setStatus(''), 3000);
        document.getElementById('battle-stats-clear').classList.remove('hidden');
        document.getElementById('battle-stats-update').classList.remove('hidden');

    } catch (err) {
        setStatus('Error: ' + err.message);
        console.error('[Battle Stats]', err);
    }
}

// ── Canvas face-crop for damage bar icons ─────────────────────────────────────
// Avoids CSS object-fit zoom distortion by drawing a 1:1 crop of the face area.

let _dmgFaceDrawQueue = [];

// Image cache so we don't reload the same source repeatedly
const _dmgImgCache = {};

function _flushDmgFaceQueue() {
    const queue = _dmgFaceDrawQueue.splice(0);
    queue.forEach(({ canvasId, imgSrc, size }) => {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        function drawCrop(img) {
            const ctx = canvas.getContext('2d');
            const iw = img.naturalWidth  || img.width;
            const ih = img.naturalHeight || img.height;

            // Determine the face-region vertical centre from getFacePosition
            // getFacePosition returns "X% Y%" — we use the Y% to position the crop window
            const posStr = (typeof getFacePosition === 'function') ? getFacePosition(imgSrc) : '50% 10%';
            const parts  = posStr.split(' ');
            const faceCX = parseFloat(parts[0]) / 100;  // 0–1 horizontal
            const faceCY = parseFloat(parts[1]) / 100;  // 0–1 vertical

            // Crop a square from the source image — use the full width as the crop side
            // so the face is never zoomed in, just repositioned.
            const cropSide = Math.min(iw, ih * 0.65); // portrait images: take upper portion
            const srcX = Math.max(0, Math.min(iw - cropSide, (iw * faceCX) - cropSide / 2));
            const srcY = Math.max(0, Math.min(ih - cropSide, (ih * faceCY) - cropSide / 2));

            // Clip to circle and draw
            ctx.clearRect(0, 0, size, size);
            ctx.save();
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(img, srcX, srcY, cropSide, cropSide, 0, 0, size, size);
            ctx.restore();
        }

        if (_dmgImgCache[imgSrc]) {
            drawCrop(_dmgImgCache[imgSrc]);
        } else {
            const img = new Image();
            img.onload = () => { _dmgImgCache[imgSrc] = img; drawCrop(img); };
            img.onerror = () => {};
            img.src = imgSrc;
        }
    });
}

// ── Render bar chart ───────────────────────────────────────────────────────────

function renderBStatBars() {
    const rows     = bstatDealt;
    const barsEl   = document.getElementById('battle-stats-bars');
    const totalEl  = document.getElementById('battle-stats-total');
    const totalVal = document.getElementById('battle-stats-total-val');
    const uploadRow = document.getElementById('bstat-upload-row');

    if (!rows || rows.length === 0) {
        barsEl.innerHTML = '<div style="text-align:center;font-size:11px;color:#475569;font-style:italic;margin-top:8px;">No data yet</div>';
        totalEl.classList.add('hidden');
        if (uploadRow) uploadRow.classList.remove('hidden');
        return;
    }

    if (uploadRow) uploadRow.classList.add('hidden');
    const updateBtn = document.getElementById('battle-stats-update');
    if (updateBtn && !bstatUpdateMode) updateBtn.classList.remove('hidden');

    // Fix the bars container to a stable height so the panel never reflows
    barsEl.style.flex = '1';
    barsEl.style.display = 'flex';
    barsEl.style.flexDirection = 'column';
    barsEl.style.justifyContent = 'space-evenly';
    barsEl.style.gap = '0';

    const maxVal = Math.max(...rows.map(r => r.value));
    const total  = rows.reduce((s, r) => s + r.value, 0);

    const elementBarColors = {
        Fire:     ['#f97316', '#fb923c'],
        Frost:    ['#3b82f6', '#60a5fa'],
        Nature:   ['#22c55e', '#4ade80'],
        Holy:     ['#ecd308', '#fde68a'],
        Shock:    ['#a855f7', '#c084fc'],
        Chaos:    ['#ec4899', '#f472b6'],
        Radiance: ['#ca8a04', '#fcd34d'],
    };

    const displayRows = rows.map((ocrRow, i) => {
        const teamSlotIdx = 4 - i;
        return { teamSlotIdx, value: ocrRow.value, pct: ocrRow.pct };
    });

    // Reset the draw queue — each row push will add its canvas job
    _dmgFaceDrawQueue = [];

    barsEl.innerHTML = displayRows.map((entry, i) => {
        const { teamSlotIdx, value, pct } = entry;
        const barPct = maxVal > 0 ? (value / maxVal * 100).toFixed(1) : 0;
        const isTop  = value === maxVal && value > 0;

        const slotCharEl = (typeof slotData !== 'undefined' && slotData[teamSlotIdx]?.character)
            ? (getCharInfo(slotData[teamSlotIdx].character)?.element || '')
            : '';
        const elColors = elementBarColors[slotCharEl];
        const fill = elColors
            ? `linear-gradient(90deg,${elColors[0]},${elColors[1]})`
            : isTop
                ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
                : 'linear-gradient(90deg,#4b6bfb,#7c9dff)';

        const ICON_SIZE = 72; // px — display size of the circular avatar
        const slotChar = (typeof slotData !== 'undefined' && slotData[teamSlotIdx]) ? slotData[teamSlotIdx].character : null;
        const borderColor = elColors ? elColors[0] : '#2d3142';
        const ringStyle = `width:${ICON_SIZE}px;height:${ICON_SIZE}px;border-radius:50%;border:2px solid ${borderColor};overflow:hidden;background:#20222f;flex-shrink:0;box-shadow:0 0 8px ${borderColor}55;`;

        let iconHtml = '';
        if (slotChar) {
            const charEntry = (typeof db !== 'undefined' && db.characters) ? db.characters.find(c => c.name === slotChar) : null;
            if (charEntry) {
                const imgSrc = (typeof getSlotCharImg === 'function')
                    ? (getSlotCharImg(teamSlotIdx) || charEntry.img)
                    : charEntry.img;
                // Use a canvas element that we fill via JS after render — avoids CSS zoom distortion
                const canvasId = `dmg-face-${teamSlotIdx}-${Date.now()}`;
                iconHtml = `<div style="${ringStyle}position:relative;" title="${slotChar}">` +
                    `<canvas id="${canvasId}" width="${ICON_SIZE}" height="${ICON_SIZE}" style="width:${ICON_SIZE}px;height:${ICON_SIZE}px;display:block;border-radius:50%;"></canvas>` +
                    `</div>`;
                // Schedule the face-crop draw after this HTML is injected into the DOM
                _dmgFaceDrawQueue.push({ canvasId, imgSrc, size: ICON_SIZE });
            } else {
                iconHtml = `<div style="${ringStyle}display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#475569;" title="${slotChar}">${teamSlotIdx + 1}</div>`;
            }
        } else {
            iconHtml = `<div style="${ringStyle}display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#475569;">${teamSlotIdx + 1}</div>`;
        }

        let deltaHtml = '';
        if (bstatPrev && bstatPrev[i] && value > 0) {
            const diff = value - bstatPrev[i].value;
            if (diff > 0) {
                deltaHtml = `<span style="font-size:9px;color:#34d399;font-weight:700;white-space:nowrap;"><i class="fa-solid fa-arrow-up" style="font-size:8px;"></i> +${diff.toLocaleString()}</span>`;
            } else if (diff < 0) {
                deltaHtml = `<span style="font-size:9px;color:#f87171;font-weight:700;white-space:nowrap;"><i class="fa-solid fa-arrow-down" style="font-size:8px;"></i> ${diff.toLocaleString()}</span>`;
            }
        }

        const zeroStyle = value === 0 ? 'opacity:0.45;' : '';

        return `<div style="display:flex;align-items:center;gap:10px;height:72px;${zeroStyle}">
                <div style="flex-shrink:0;">${iconHtml}</div>
                <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:5px;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <div style="flex:1;max-width:160px;height:7px;background:#20222f;border-radius:4px;overflow:hidden;">
                            <div style="width:${barPct}%;height:100%;background:${fill};border-radius:4px;transition:width 0.7s cubic-bezier(.22,.68,0,1.2);"></div>
                        </div>
                        <span style="font-size:11px;color:#94a3b8;min-width:42px;text-align:right;font-weight:700;">${value > 0 ? pct.toFixed(1) + '%' : '—'}</span>
                    </div>
                    <div style="display:flex;align-items:center;justify-content:flex-end;gap:5px;">
                        <span style="font-size:10px;color:#64748b;font-variant-numeric:tabular-nums;">${value > 0 ? value.toLocaleString() : '—'}</span>
                        ${deltaHtml}
                    </div>
                </div>
        </div>`;
    }).join('');

    // Canvas elements are now in the DOM — draw face crops
    requestAnimationFrame(_flushDmgFaceQueue);

    totalVal.textContent = total.toLocaleString();

    const totalDeltaEl = document.getElementById('battle-stats-total-delta');
    if (totalDeltaEl) {
        if (bstatPrev) {
            const prevTotal = bstatPrev.reduce((s, r) => s + r.value, 0);
            const diff = total - prevTotal;
            if (diff > 0) {
                totalDeltaEl.innerHTML = `<span style="color:#34d399;font-size:11px;font-weight:700;"><i class="fa-solid fa-arrow-up" style="font-size:9px;"></i> +${diff.toLocaleString()}</span>`;
            } else if (diff < 0) {
                totalDeltaEl.innerHTML = `<span style="color:#f87171;font-size:11px;font-weight:700;"><i class="fa-solid fa-arrow-down" style="font-size:9px;"></i> ${diff.toLocaleString()}</span>`;
            } else {
                totalDeltaEl.innerHTML = `<span style="color:#64748b;font-size:11px;">no change</span>`;
            }
        } else {
            totalDeltaEl.innerHTML = '';
        }
    }
    totalEl.classList.remove('hidden');
}

// ── Clear ──────────────────────────────────────────────────────────────────────

function clearBattleStats() {
    bstatDealt      = null;
    bstatPrev       = null;
    bstatUpdateMode = false;
    renderBStatBars();
    setStatus('');
    document.getElementById('battle-stats-total').classList.add('hidden');
    const deltaEl = document.getElementById('battle-stats-total-delta');
    if (deltaEl) deltaEl.innerHTML = '';
    document.getElementById('battle-stats-clear').classList.add('hidden');
    document.getElementById('battle-stats-update').classList.add('hidden');
    const uploadRow = document.getElementById('bstat-upload-row');
    if (uploadRow) uploadRow.classList.remove('hidden');
}

// ── Status helper ──────────────────────────────────────────────────────────────

function setStatus(msg) {
    document.getElementById('battle-stats-status').textContent = msg;
}
