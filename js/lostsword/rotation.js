// ── rotation.js ───────────────────────────────────────────────────────────────
// Ultimate rotation state, rendering, drag-and-drop, and all helper functions.
// Depends on: db, slotData, getFacePosition, openModal, closeModal (index.html)

// ── State ─────────────────────────────────────────────────────────────────────

let ultimateRotation = Array(11).fill().map(() => ({ character: null, time: '' }));

let _ultDragFromIdx = null;
let brawlKillCount = null;

// ── Layout constants ──────────────────────────────────────────────────────────
// 88px icon — halfway between original 96px and reduced 80px.
// 11×88 + 10×(14+4) = 968 + 180 = 1148px — fits in max-w-7xl container.
const ULT_ICON    = 88;   // px — character icon square
const ULT_GAP     = 4;    // px — flex gap between items
const ULT_ARROW_W = 14;   // px

// Pill overhang above the icon (half the pill height so it straddles the top edge)
const ULT_PILL_H  = 20;   // px — height of the hover control pill
const ULT_OVERHANG = Math.ceil(ULT_PILL_H / 2); // 10px above icon top

// ── Timing helpers ────────────────────────────────────────────────────────────
function _parseTime(raw) {
    const out = { dps: '', def: '' };
    if (!raw || !raw.trim()) return out;
    if (!raw.includes('=')) { out.dps = raw.trim(); return out; }
    raw.split('|').forEach(part => {
        const eq = part.indexOf('=');
        if (eq === -1) return;
        const key = part.slice(0, eq).trim();
        const val = part.slice(eq + 1).trim();
        if (key === 'dps' && val) out.dps = val;
        if (key === 'def' && val) out.def = val;
        if (key === 'range' && val) out.dps = val;
    });
    return out;
}

function _serializeTime(dps, def) {
    const parts = [];
    if ((dps || '').trim()) parts.push('dps=' + dps.trim());
    if ((def || '').trim()) parts.push('def=' + def.trim());
    return parts.join('|');
}

// ── Render ────────────────────────────────────────────────────────────────────

function renderUltimateRotation() {
    const container = document.getElementById('ultimate-rotation-container');
    if (!container) return;

    // No wrap — all 11 slots stay on one line.
    // padding-top reserves space for the hover pill that straddles the top of each icon.
    container.style.cssText = [
        'display:flex',
        'flex-wrap:nowrap',
        'align-items:flex-start',
        `gap:${ULT_GAP}px`,
        `padding-top:${ULT_OVERHANG}px`,
        'overflow:visible',
        'width:100%',
    ].join(';');

    const x2Idx   = ultimateRotation.findIndex(s => s.character === 'x2');
    const autoIdx = ultimateRotation.findIndex(s => s.character === 'auto');
    const repeatIdx = x2Idx === -1 && autoIdx === -1 ? -1
                    : x2Idx === -1 ? autoIdx
                    : autoIdx === -1 ? x2Idx
                    : Math.min(x2Idx, autoIdx);

    container.innerHTML = '';

    ultimateRotation.forEach((slot, idx) => {
        if (repeatIdx !== -1 && idx > repeatIdx) return;

        // ── Slot wrapper ──────────────────────────────────────────────────────
        const slotDiv = document.createElement('div');
        slotDiv.className = 'ult-rotation-slot';
        slotDiv.dataset.ultIdx = idx;
        slotDiv.style.cssText = [
            'display:flex',
            'flex-direction:column',
            'align-items:center',
            'gap:0',
            'flex-shrink:0',
            'position:relative',
            'padding:0',
            `width:${ULT_ICON}px`,
        ].join(';');

        // ── Character icon ────────────────────────────────────────────────────
        const iconDiv = document.createElement('div');
        iconDiv.className = 'ult-char-icon' + (slot.character ? '' : ' empty');
        iconDiv.style.cssText = [
            `width:${ULT_ICON}px`,
            `height:${ULT_ICON}px`,
            'border-radius:0.5rem',
            'background:#20222f',
            'border:2px solid #2d3142',
            'cursor:pointer',
            'transition:border-color 0.2s ease, background 0.2s ease',
            'display:flex',
            'align-items:center',
            'justify-content:center',
            'overflow:hidden',
            'position:relative',
            'flex-shrink:0',
        ].join(';');
        iconDiv.draggable = true;
        iconDiv.dataset.ultIdx = idx;

        iconDiv.addEventListener('mouseenter', () => {
            iconDiv.style.borderColor = '#4b6bfb';
            iconDiv.style.background  = '#1e2240';
        });
        iconDiv.addEventListener('mouseleave', (e) => {
            if (!iconDiv.contains(e.relatedTarget)) {
                iconDiv.style.borderColor = '#2d3142';
                iconDiv.style.background  = '#20222f';
            }
        });

        iconDiv.addEventListener('dragstart', (e) => {
            _ultDragFromIdx = idx;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', String(idx));
            setTimeout(() => { iconDiv.style.opacity = '0.45'; }, 0);
        });
        iconDiv.addEventListener('dragend', () => {
            _ultDragFromIdx = null;
            iconDiv.style.opacity = '';
            document.querySelectorAll('.ult-rotation-slot').forEach(s => { s.style.outline = ''; });
        });

        slotDiv.addEventListener('dragover', (e) => {
            if (_ultDragFromIdx !== null && _ultDragFromIdx !== idx) {
                e.preventDefault();
                slotDiv.style.outline = '2px solid #4b6bfb';
                slotDiv.style.borderRadius = '0.5rem';
            }
        });
        slotDiv.addEventListener('dragleave', (e) => {
            if (!slotDiv.contains(e.relatedTarget)) slotDiv.style.outline = '';
        });
        slotDiv.addEventListener('drop', (e) => {
            e.preventDefault();
            slotDiv.style.outline = '';
            const from = _ultDragFromIdx;
            _ultDragFromIdx = null;
            if (from !== null && from !== idx) {
                [ultimateRotation[from], ultimateRotation[idx]] = [ultimateRotation[idx], ultimateRotation[from]];
                renderUltimateRotation();
            }
        });

        // Click opens modal
        iconDiv.addEventListener('click', () => {
            selectUltimateCharacter(idx);
        });

        // ── Icon content ──────────────────────────────────────────────────────
        const iconContent = document.createElement('div');
        iconContent.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:0.45rem;';

        if (slot.character === 'x2') {
            iconContent.innerHTML = '<span style="font-size:13px;font-weight:700;color:#64748b;">x2</span>';
        } else if (slot.character === 'auto') {
            iconContent.innerHTML = '<span style="font-size:11px;font-weight:700;color:#4ade80;">Auto</span>';
        } else if (slot.character) {
            const charEntry = db.characters ? db.characters.find(c => c.name === slot.character) : null;
            if (charEntry) {
                const teamSlotIdx = (typeof slotData !== 'undefined')
                    ? slotData.findIndex(s => s.character === slot.character) : -1;
                const iconSrc = (teamSlotIdx !== -1 && typeof getSlotIconPath === 'function')
                    ? (getSlotIconPath(teamSlotIdx, 'large') || getCharIconPath(slot.character, 'large'))
                    : (typeof getCharIconPath === 'function' ? getCharIconPath(slot.character, 'large') : charEntry.img);
                const img = document.createElement('img');
                img.src   = iconSrc;
                img.alt   = slot.character;
                img.style.cssText = 'width:100%;height:100%;object-fit:cover;object-position:50% 15%;display:block;';
                img.onerror = function() {
                    this.onerror = null;
                    this.src = charEntry.img;
                    this.style.objectPosition = getFacePosition(charEntry.img);
                };
                iconContent.appendChild(img);
            } else {
                iconContent.innerHTML = '<span style="font-size:10px;font-weight:700;color:#475569;">' + slot.character.substring(0,2).toUpperCase() + '</span>';
            }
        } else {
            iconContent.innerHTML = '<span style="font-size:16px;color:#64748b;">+</span>';
        }
        iconDiv.appendChild(iconContent);
        slotDiv.appendChild(iconDiv);

        // ── Timing section (only for non-marker slots) ────────────────────────
        if (slot.character !== 'x2' && slot.character !== 'auto') {
            const timing  = _parseTime(slot.time);
            const hasDps  = !!timing.dps;
            const hasDef  = !!timing.def;
            const hasTime = hasDps || hasDef;

            // ── Unified hover control pill ─────────────────────────────────────
            // Straddles the top of the icon: positioned at top:0, translated up by half its height.
            // Only visible while hovering the slot wrapper.
            const ctrlPill = document.createElement('div');
            ctrlPill.style.cssText = [
                'position:absolute',
                'top:0',
                'left:50%',
                `transform:translate(-50%, -${ULT_OVERHANG}px)`,
                'display:flex',
                'align-items:stretch',
                `width:${ULT_ICON}px`,
                `height:${ULT_PILL_H}px`,
                'border-radius:6px',
                'overflow:hidden',
                'background:#0f111a',
                'border:1.5px solid #2d3142',
                'box-shadow:0 2px 8px rgba(0,0,0,0.6)',
                'opacity:0',
                'pointer-events:none',
                'transition:opacity 0.15s ease',
                'z-index:20',
            ].join(';');

            // Show/hide on slot hover
            slotDiv.addEventListener('mouseenter', () => {
                ctrlPill.style.opacity = '1';
                ctrlPill.style.pointerEvents = 'auto';
            });
            slotDiv.addEventListener('mouseleave', (e) => {
                if (!slotDiv.contains(e.relatedTarget)) {
                    ctrlPill.style.opacity = '0';
                    ctrlPill.style.pointerEvents = 'none';
                }
            });

            // ── Time wrapper (DPS + DEF rows) ─────────────────────────────────
            const timeWrapper = document.createElement('div');
            timeWrapper.style.cssText = [
                'overflow:hidden',
                `max-height:${hasTime ? '60px' : '0'}`,
                `opacity:${hasTime ? '1' : '0'}`,
                'transition:max-height 0.28s ease, opacity 0.22s ease',
                `width:${ULT_ICON}px`,
                'margin-top:3px',
                'display:flex',
                'flex-direction:column',
                'gap:3px',
            ].join(';');
            if (hasTime) timeWrapper.classList.add('visible');

            // DPS row
            const dpsInput = _makeTimeInput(timing.dps, '#f87171', 'Offensive');
            const dpsRow   = _makeTimeRow(dpsInput, '#f87171');
            timeWrapper.appendChild(dpsRow);

            // DEF row
            const defInput = _makeTimeInput(timing.def, '#60a5fa', 'Defensive');
            const defRow   = _makeTimeRow(defInput, '#60a5fa');
            const defWrap  = document.createElement('div');
            defWrap.style.cssText = [
                'overflow:hidden',
                `max-height:${hasDef ? '30px' : '0'}`,
                `opacity:${hasDef ? '1' : '0'}`,
                'transition:max-height 0.2s ease, opacity 0.18s ease',
            ].join(';');
            defWrap.appendChild(defRow);
            timeWrapper.appendChild(defWrap);

            // Wire save on input
            function _saveTime() {
                ultimateRotation[idx].time = _serializeTime(dpsInput.value, defInput.value);
            }
            dpsInput.addEventListener('input', _saveTime);
            defInput.addEventListener('input', _saveTime);

            // Track + click count: 0=nothing, 1=DPS open, 2=both open
            let _plusPressCount = hasDef ? 2 : hasDps ? 1 : 0;

            // ── Pill section factory ───────────────────────────────────────────
            function _makePillSection(label, title, color, hoverBg) {
                const sec = document.createElement('div');
                sec.title = title;
                sec.textContent = label;
                sec._activeColor = color;
                sec._hoverBg = hoverBg;
                sec.style.cssText = [
                    'flex:1',
                    'display:flex',
                    'align-items:center',
                    'justify-content:center',
                    'cursor:pointer',
                    `color:${color}`,
                    'font-size:13px',
                    'font-weight:900',
                    'line-height:1',
                    'transition:background 0.1s, color 0.1s',
                    'user-select:none',
                    '-webkit-user-select:none',
                    'padding:0',
                ].join(';');
                sec.addEventListener('mouseenter', () => {
                    if (sec._disabled) return;
                    sec.style.background = sec._hoverBg;
                    sec.style.color = '#fff';
                });
                sec.addEventListener('mouseleave', () => {
                    if (sec._disabled) return;
                    sec.style.background = '';
                    sec.style.color = sec._activeColor;
                });
                return sec;
            }

            // Sets enabled/disabled visual state on a pill section
            function _setPillEnabled(sec, enabled) {
                sec._disabled = !enabled;
                sec.style.cursor     = enabled ? 'pointer' : 'not-allowed';
                sec.style.opacity    = enabled ? '1' : '0.28';
                sec.style.color      = enabled ? sec._activeColor : '#475569';
                sec.style.background = '';
                sec.style.pointerEvents = enabled ? '' : 'none';
            }

            // Sync +/− enabled state to current _plusPressCount
            function _updatePillStates() {
                // [−] enabled only when at least 1 timing row is open
                _setPillEnabled(defToggleSec, _plusPressCount > 0);
                // [+] enabled only when fewer than 2 rows are open
                _setPillEnabled(addSec, _plusPressCount < 2);
                // [×] always enabled (nothing to show if already empty, but harmless)
                _setPillEnabled(clearSec, true);
            }

            const div1 = document.createElement('div');
            div1.style.cssText = 'width:1px;background:#2d3142;flex-shrink:0;';
            const div2 = document.createElement('div');
            div2.style.cssText = 'width:1px;background:#2d3142;flex-shrink:0;';

            // [−] left: remove the last open timing row
            const defToggleSec = _makePillSection('−', 'Remove timing row', '#f87171', '#2a0f0f');
            defToggleSec.addEventListener('click', (e) => {
                e.stopPropagation();
                if (_plusPressCount === 0) return;
                if (_plusPressCount === 2) {
                    // Close DEF row
                    defWrap.style.maxHeight = '0';
                    defWrap.style.opacity = '0';
                    defInput.value = '';
                    ultimateRotation[idx].time = _serializeTime(dpsInput.value, '');
                    _plusPressCount = 1;
                } else if (_plusPressCount === 1) {
                    // Close DPS row (and the whole wrapper)
                    timeWrapper.style.maxHeight = '0';
                    timeWrapper.style.opacity = '0';
                    dpsInput.value = '';
                    ultimateRotation[idx].time = '';
                    _plusPressCount = 0;
                }
                _updatePillStates();
            });

            // [+] center: 1st click → open DPS row, 2nd click → open DEF row
            const addSec = _makePillSection('+', 'Add timing row (click twice for DEF)', '#4b6bfb', '#0d1a36');
            addSec.addEventListener('click', (e) => {
                e.stopPropagation();
                if (_plusPressCount === 0) {
                    timeWrapper.style.maxHeight = '60px';
                    timeWrapper.style.opacity = '1';
                    _plusPressCount = 1;
                    setTimeout(() => dpsInput.focus(), 50);
                } else if (_plusPressCount === 1) {
                    defWrap.style.maxHeight = '30px';
                    defWrap.style.opacity = '1';
                    _plusPressCount = 2;
                    setTimeout(() => defInput.focus(), 50);
                }
                _updatePillStates();
            });

            // [×] right: clear all timing rows
            const clearSec = _makePillSection('×', 'Clear all timing', '#f87171', '#2a0f0f');
            clearSec.addEventListener('click', (e) => {
                e.stopPropagation();
                timeWrapper.style.maxHeight = '0';
                timeWrapper.style.opacity = '0';
                dpsInput.value = '';
                defInput.value = '';
                defWrap.style.maxHeight = '0';
                defWrap.style.opacity = '0';
                _plusPressCount = 0;
                ultimateRotation[idx].time = '';
                _updatePillStates();
            });

            // Set initial states
            _updatePillStates();

            ctrlPill.appendChild(defToggleSec);
            ctrlPill.appendChild(div1);
            ctrlPill.appendChild(addSec);
            ctrlPill.appendChild(div2);
            ctrlPill.appendChild(clearSec);

            slotDiv.appendChild(ctrlPill);
            slotDiv.appendChild(timeWrapper);
        }

        container.appendChild(slotDiv);

        // ── Arrow between slots ───────────────────────────────────────────────
        // align-self:flex-start + margin-top = ULT_OVERHANG keeps the arrow
        // anchored to the icon row, not the full slot height (which grows when
        // timing rows expand). Height = ULT_ICON so flexbox centers the glyph
        // within exactly the icon zone.
        if (idx < ultimateRotation.length - 1 && (repeatIdx === -1 || idx < repeatIdx)) {
            const arrowDiv = document.createElement('div');
            arrowDiv.className = 'ult-arrow';
            arrowDiv.style.cssText = [
                'color:#475569',
                'font-size:16px',
                'font-weight:700',
                'display:flex',
                'align-items:center',
                'justify-content:center',
                'flex-shrink:0',
                'align-self:flex-start',
                `margin-top:${ULT_OVERHANG}px`,
                `height:${ULT_ICON}px`,
                `width:${ULT_ARROW_W}px`,
                'padding:0',
                'margin-left:0',
                'margin-right:0',
            ].join(';');
            arrowDiv.innerHTML = '›';
            container.appendChild(arrowDiv);
        }
    });

    // ── +/- slot count controls ───────────────────────────────────────────────
    const controlsDiv = document.getElementById('ultimate-rotation-controls');
    if (controlsDiv) {
        controlsDiv.innerHTML = '';
        if (repeatIdx === -1) {
            const canAdd    = ultimateRotation.length < 11;
            const canRemove = ultimateRotation.length > 2;

            const addBtn = document.createElement('button');
            addBtn.onclick     = canAdd ? addUltimateSlot : null;
            addBtn.disabled    = !canAdd;
            addBtn.title       = canAdd ? 'Add slot' : 'Max slots reached';
            addBtn.textContent = '+';
            addBtn.style.cssText = `width:24px;height:20px;border-radius:4px;background:#20222f;border:1px solid #2d3142;cursor:${canAdd?'pointer':'not-allowed'};display:flex;align-items:center;justify-content:center;color:${canAdd?'#22c55e':'#475569'};font-size:13px;font-weight:700;opacity:${canAdd?'1':'0.5'};transition:all 0.15s;`;
            if (canAdd) {
                addBtn.onmouseover = () => { addBtn.style.borderColor='#4b6bfb'; addBtn.style.background='#1e2240'; };
                addBtn.onmouseout  = () => { addBtn.style.borderColor='#2d3142'; addBtn.style.background='#20222f'; };
            }
            controlsDiv.appendChild(addBtn);

            const removeBtn = document.createElement('button');
            removeBtn.onclick     = canRemove ? removeUltimateSlot : null;
            removeBtn.disabled    = !canRemove;
            removeBtn.title       = canRemove ? 'Remove slot' : 'Min slots reached';
            removeBtn.textContent = '−';
            removeBtn.style.cssText = `width:24px;height:20px;border-radius:4px;background:#20222f;border:1px solid #2d3142;cursor:${canRemove?'pointer':'not-allowed'};display:flex;align-items:center;justify-content:center;color:${canRemove?'#f87171':'#475569'};font-size:13px;font-weight:700;opacity:${canRemove?'1':'0.5'};transition:all 0.15s;`;
            if (canRemove) {
                removeBtn.onmouseover = () => { removeBtn.style.borderColor='#f87171'; removeBtn.style.background='#2a121d'; };
                removeBtn.onmouseout  = () => { removeBtn.style.borderColor='#2d3142'; removeBtn.style.background='#20222f'; };
            }
            controlsDiv.appendChild(removeBtn);
        }
    }
}

// ── Time input / row builders ─────────────────────────────────────────────────

function _makeTimeInput(value, accentColor, placeholder) {
    const inp = document.createElement('input');
    inp.type        = 'text';
    inp.value       = value || '';
    inp.placeholder = placeholder;
    inp.style.cssText = [
        'width:100%',
        'box-sizing:border-box',
        'height:100%',
        'padding:0 6px',
        'font-size:10px',
        'font-weight:700',
        'text-align:center',
        'background:transparent',
        'border:none',
        'outline:none',
        `color:${accentColor}`,
        'font-family:system-ui,sans-serif',
        'line-height:22px',
        'padding-top:0',
        'padding-bottom:0',
    ].join(';');
    return inp;
}

function _makeTimeRow(input, accentColor) {
    const row = document.createElement('div');
    row.style.cssText = [
        'display:flex',
        'align-items:center',
        'justify-content:center',
        `width:${ULT_ICON}px`,
        'height:22px',
        'border-radius:4px',
        'background:#0f111a',
        `border:1.5px solid ${accentColor}88`,
        'overflow:hidden',
        'box-sizing:border-box',
    ].join(';');
    row.appendChild(input);
    return row;
}

// ── Slot management ───────────────────────────────────────────────────────────

function addUltimateSlot() {
    if (ultimateRotation.length >= 11) return;
    ultimateRotation.push({ character: null, time: '' });
    renderUltimateRotation();
}

function removeUltimateSlot() {
    if (ultimateRotation.length <= 2) return;
    ultimateRotation.pop();
    renderUltimateRotation();
}

function resetUltimateRotation() {
    ultimateRotation = Array(11).fill().map(() => ({ character: null, time: '' }));
    brawlKillCount = null;
    renderUltimateRotation();
}

// ── Modal helpers ─────────────────────────────────────────────────────────────

function selectUltimateCharacter(slotIdx) {
    currentActiveSection = slotIdx;
    currentActiveCategory = 'ultimate';
    openModal(slotIdx, 'ultimate');
}

function selectUltimateX2() {
    if (_ultSeqActive && _ultSeqEnabled) {
        const targetIdx = _ultSeqStartIdx + _ultSeqQueue.length;
        if (targetIdx < ultimateRotation.length) {
            ultimateRotation[targetIdx].character = 'x2';
            ultimateRotation[targetIdx].time = '';
            for (let i = targetIdx + 1; i < ultimateRotation.length; i++) {
                ultimateRotation[i].character = null;
                ultimateRotation[i].time = '';
            }
        }
        renderUltimateRotation();
        closeModal();
        return;
    }
    if (typeof currentActiveSection !== 'number') return;
    ultimateRotation[currentActiveSection].character = 'x2';
    ultimateRotation[currentActiveSection].time = '';
    renderUltimateRotation();
    closeModal();
}

function selectUltimateAuto() {
    if (_ultSeqActive && _ultSeqEnabled) {
        const targetIdx = _ultSeqStartIdx + _ultSeqQueue.length;
        if (targetIdx < ultimateRotation.length) {
            ultimateRotation[targetIdx].character = 'auto';
            ultimateRotation[targetIdx].time = '';
            for (let i = targetIdx + 1; i < ultimateRotation.length; i++) {
                ultimateRotation[i].character = null;
                ultimateRotation[i].time = '';
            }
        }
        renderUltimateRotation();
        closeModal();
        return;
    }
    if (typeof currentActiveSection !== 'number') return;
    ultimateRotation[currentActiveSection].character = 'auto';
    ultimateRotation[currentActiveSection].time = '';
    renderUltimateRotation();
    closeModal();
}

// ── Brawl kill counter ────────────────────────────────────────────────────────

function toggleBrawlCounter() {
    brawlKillCount = brawlKillCount === null ? 0 : null;
    renderUltimateRotation();
}

function setBrawlKills(n) {
    if (brawlKillCount === null) return;
    brawlKillCount = Math.max(0, n);
    const inp = document.getElementById('brawl-total-kills');
    if (inp) inp.value = String(brawlKillCount);
}
