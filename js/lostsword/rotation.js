// ── rotation.js ───────────────────────────────────────────────────────────────
// Ultimate rotation state, rendering, drag-and-drop, and all helper functions.
// Depends on: db, slotData, getFacePosition, openModal, closeModal (index.html)

// ── State ─────────────────────────────────────────────────────────────────────

let ultimateRotation = Array(11).fill().map(() => ({ character: null, time: '' }));

let _ultDragFromIdx = null;

// Brawl kill counter — null means disabled, 0+ means enabled
let brawlKillCount = null;

// ── Render ────────────────────────────────────────────────────────────────────

function renderUltimateRotation() {
    const container = document.getElementById('ultimate-rotation-container');
    if (!container) return;

    // Find the x2 or auto marker (whichever comes first)
    const x2Idx   = ultimateRotation.findIndex(slot => slot.character === 'x2');
    const autoIdx = ultimateRotation.findIndex(slot => slot.character === 'auto');
    const repeatIdx = x2Idx === -1 && autoIdx === -1 ? -1
                    : x2Idx === -1 ? autoIdx
                    : autoIdx === -1 ? x2Idx
                    : Math.min(x2Idx, autoIdx);

    container.innerHTML = '';
    ultimateRotation.forEach((slot, idx) => {
        // Hide slots after the repeat marker
        if (repeatIdx !== -1 && idx > repeatIdx) return;

        const slotDiv = document.createElement('div');
        slotDiv.className = 'ult-rotation-slot';
        slotDiv.dataset.ultIdx = idx;

        // Character icon
        const iconDiv = document.createElement('div');
        iconDiv.className = 'ult-char-icon' + (slot.character ? '' : ' empty');
        iconDiv.style.cursor = 'grab';
        iconDiv.draggable = true;
        iconDiv.dataset.ultIdx = idx;

        // Drag source events — use module-level _ultDragFromIdx because
        // dataTransfer.getData() returns '' during dragover (browser security)
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

        // Drop target events
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
            const to   = idx;
            _ultDragFromIdx = null;
            if (from !== null && from !== to) {
                [ultimateRotation[from], ultimateRotation[to]] = [ultimateRotation[to], ultimateRotation[from]];
                renderUltimateRotation();
            }
        });

        iconDiv.onclick = () => selectUltimateCharacter(idx);

        if (slot.character === 'x2') {
            iconDiv.innerHTML = '<span style="font-size:14px;font-weight:700;color:#64748b;">x2</span>';
        } else if (slot.character === 'auto') {
            iconDiv.innerHTML = '<span style="font-size:12px;font-weight:700;color:#4ade80;">Auto</span>';
        } else if (slot.character) {
            const charEntry = db.characters ? db.characters.find(c => c.name === slot.character) : null;
            if (charEntry) {
                // Use skin-aware image if this character occupies a team slot
                const teamSlotIdx = (typeof slotData !== 'undefined')
                    ? slotData.findIndex(s => s.character === slot.character)
                    : -1;
                const imgSrc = (teamSlotIdx !== -1 && typeof getSlotCharImg === 'function')
                    ? (getSlotCharImg(teamSlotIdx) || charEntry.img)
                    : charEntry.img;
                const img = document.createElement('img');
                img.src = imgSrc;
                img.alt = slot.character;
                img.style.objectPosition = getFacePosition(imgSrc);
                iconDiv.innerHTML = '';
                iconDiv.appendChild(img);
            } else {
                iconDiv.innerHTML = '<span style="font-size:10px;font-weight:700;color:#475569;">' + (slot.character.substring(0, 2).toUpperCase()) + '</span>';
            }
        } else {
            iconDiv.innerHTML = '<span class="text-xs text-slate-400">+</span>';
        }

        // Time input wrapper — always in DOM, hidden by default
        const timeWrapper = document.createElement('div');
        if (slot.character !== 'x2' && slot.character !== 'auto') {
            const hasTime = slot.time && slot.time.trim() !== '';
            timeWrapper.className = 'ult-time-wrapper' + (hasTime ? ' visible' : '');
            if (hasTime) slotDiv.classList.add('has-time');

            const timeInput = document.createElement('input');
            timeInput.type = 'text';
            timeInput.className = 'ult-time-input';
            timeInput.placeholder = 'Time';
            timeInput.value = slot.time;
            timeInput.addEventListener('change', (e) => {
                ultimateRotation[idx].time = e.target.value;
            });
            timeWrapper.appendChild(timeInput);
        }

        slotDiv.appendChild(iconDiv);

        // Add-time toggle button — top-right of slotDiv, hover-only
        if (slot.character !== 'x2' && slot.character !== 'auto') {
            const hasTime = slot.time && slot.time.trim() !== '';
            const addTimeBtn = document.createElement('button');
            addTimeBtn.className = 'ult-add-time-btn';
            addTimeBtn.title = hasTime ? 'Hide time slot' : 'Add time slot';
            addTimeBtn.innerHTML = hasTime
                ? '<span style="font-size:13px;font-weight:700;line-height:1;display:block;margin-top:-1px;">×</span>'
                : '<span style="font-size:14px;font-weight:700;line-height:1;display:block;margin-top:-1px;">+</span>';
            addTimeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const showing = timeWrapper.classList.contains('visible');
                if (showing) {
                    timeWrapper.classList.remove('visible');
                    slotDiv.classList.remove('has-time');
                    addTimeBtn.innerHTML = '<span style="font-size:14px;font-weight:700;line-height:1;display:flex;align-items:center;justify-content:center;">+</span>';
                    addTimeBtn.title = 'Add time slot';
                    // Clear saved time so it doesn't reappear when a new character fills this slot
                    ultimateRotation[idx].time = '';
                    if (timeWrapper.querySelector('input')) timeWrapper.querySelector('input').value = '';
                } else {
                    timeWrapper.classList.add('visible');
                    slotDiv.classList.add('has-time');
                    addTimeBtn.innerHTML = '<span style="font-size:12px;font-weight:700;line-height:1;display:flex;align-items:center;justify-content:center;">×</span>';
                    addTimeBtn.title = 'Hide time slot';
                    timeWrapper.querySelector('input').focus();
                }
            });
            slotDiv.appendChild(addTimeBtn);
        }

        slotDiv.appendChild(timeWrapper);

        container.appendChild(slotDiv);

        // Add arrow between slots (except after the last visible one)
        if (idx < ultimateRotation.length - 1 && (repeatIdx === -1 || idx < repeatIdx)) {
            const arrowDiv = document.createElement('div');
            arrowDiv.className = 'ult-arrow';
            arrowDiv.innerHTML = '&gt;';
            container.appendChild(arrowDiv);
        }
    });

    // ── Brawl kill counter widget — appended after all rotation slots ──────────
    if (brawlKillCount !== null) {
        // "=" separator — same style as the ">" arrows between slots
        const eqArrow = document.createElement('div');
        eqArrow.className = 'ult-arrow';
        eqArrow.textContent = '=';
        container.appendChild(eqArrow);

        // Wrapper: label stacked above input, input aligned to the = sign baseline
        const killCard = document.createElement('div');
        killCard.style.cssText = 'flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:5px;align-self:center;';

        const label = document.createElement('span');
        label.textContent = 'Kills';
        label.style.cssText = 'font-size:10px;font-weight:700;color:#a78bfa;letter-spacing:0.06em;text-transform:uppercase;white-space:nowrap;';

        const input = document.createElement('input');
        input.type = 'text';
        input.id   = 'brawl-kill-input';
        input.value = String(brawlKillCount);
        input.style.cssText = `
            width:80px;height:36px;
            background:#0f111a;border:1px solid #7c3aed55;border-radius:6px;
            color:#c4b5fd;font-size:18px;font-weight:800;text-align:center;
            font-variant-numeric:tabular-nums;outline:none;
            transition:border-color 0.15s;padding:0 6px;
        `;
        input.addEventListener('focus', () => { input.style.borderColor='#a78bfa'; input.select(); });
        input.addEventListener('blur',  () => { input.style.borderColor='#7c3aed55'; });
        input.addEventListener('input', () => {
            const v = parseInt(input.value.replace(/[^0-9]/g,''), 10);
            if (!isNaN(v)) brawlKillCount = Math.max(0, v);
        });

        killCard.appendChild(label);
        killCard.appendChild(input);
        container.appendChild(killCard);
    }

    const controlsDiv = document.getElementById('ultimate-rotation-controls');
    if (controlsDiv) {
        controlsDiv.innerHTML = '';
        const hasRepeatMarker = repeatIdx !== -1;
        if (!hasRepeatMarker) {
            // Add button
            const addBtn = document.createElement('button');
            const canAdd = ultimateRotation.length < 11;
            addBtn.onclick = canAdd ? addUltimateSlot : null;
            addBtn.disabled = !canAdd;
            addBtn.style.cssText = `width:28px;height:24px;border-radius:0.375rem;background:#20222f;border:1px solid #2d3142;cursor:${canAdd ? 'pointer' : 'not-allowed'};transition:all 0.2s ease;display:flex;align-items:center;justify-content:center;color:${canAdd ? '#22c55e' : '#475569'};font-size:14px;font-weight:700;box-shadow:0 0 0 1px #0f0f15;opacity:${canAdd ? '1' : '0.5'};`;
            if (canAdd) {
                addBtn.onmouseover = function() { this.style.borderColor='#4b6bfb'; this.style.background='#1e2240'; };
                addBtn.onmouseout  = function() { this.style.borderColor='#2d3142'; this.style.background='#20222f'; };
            }
            addBtn.title = canAdd ? 'Add slot' : 'Cannot add more slots';
            addBtn.textContent = '+';
            controlsDiv.appendChild(addBtn);

            // Remove button
            const removeBtn = document.createElement('button');
            const canRemove = ultimateRotation.length > 2;
            removeBtn.onclick = canRemove ? removeUltimateSlot : null;
            removeBtn.disabled = !canRemove;
            removeBtn.style.cssText = `width:28px;height:24px;border-radius:0.375rem;background:#20222f;border:1px solid #2d3142;cursor:${canRemove ? 'pointer' : 'not-allowed'};transition:all 0.2s ease;display:flex;align-items:center;justify-content:center;color:${canRemove ? '#f87171' : '#475569'};font-size:14px;font-weight:700;box-shadow:0 0 0 1px #0f0f15;opacity:${canRemove ? '1' : '0.5'};`;
            if (canRemove) {
                removeBtn.onmouseover = function() { this.style.borderColor='#f87171'; this.style.background='#2a121d'; };
                removeBtn.onmouseout  = function() { this.style.borderColor='#2d3142'; this.style.background='#20222f'; };
            }
            removeBtn.title = canRemove ? 'Remove slot' : 'Cannot remove more slots';
            removeBtn.textContent = '-';
            controlsDiv.appendChild(removeBtn);
        }

        // ── Brawl toggle button — always visible in controls ──────────────
        const brawlBtn = document.createElement('button');
        const brawlActive = brawlKillCount !== null;
        brawlBtn.onclick = toggleBrawlCounter;
        brawlBtn.title = brawlActive ? 'Remove kill counter' : 'Add Brawl kill counter';
        brawlBtn.style.cssText = `
            height:24px;padding:0 8px;border-radius:0.375rem;
            background:${brawlActive ? '#2a1f40' : '#20222f'};
            border:1px solid ${brawlActive ? '#7c3aed' : '#2d3142'};
            cursor:pointer;transition:all 0.2s ease;
            display:flex;align-items:center;justify-content:center;gap:4px;
            color:${brawlActive ? '#a78bfa' : '#64748b'};
            font-size:10px;font-weight:700;letter-spacing:0.04em;
            box-shadow:${brawlActive ? '0 0 8px #7c3aed44' : 'none'};
            white-space:nowrap;
        `;
        brawlBtn.innerHTML = `<span style="font-size:9px;">⚔</span> Brawl`;
        brawlBtn.onmouseover = function() {
            this.style.borderColor = '#a78bfa';
            this.style.background  = '#2a1f40';
            this.style.color       = '#c4b5fd';
        };
        brawlBtn.onmouseout = function() {
            this.style.borderColor = brawlActive ? '#7c3aed' : '#2d3142';
            this.style.background  = brawlActive ? '#2a1f40' : '#20222f';
            this.style.color       = brawlActive ? '#a78bfa' : '#64748b';
        };
        controlsDiv.appendChild(brawlBtn);
    }
}

// ── Slot management ───────────────────────────────────────────────────────────

function addUltimateSlot() {
    if (ultimateRotation.length >= 12) return;
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
    if (typeof currentActiveSection !== 'number') return;
    ultimateRotation[currentActiveSection].character = 'x2';
    ultimateRotation[currentActiveSection].time = '';
    renderUltimateRotation();
    closeModal();
}

function selectUltimateAuto() {
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
    // Update the input value directly if it exists — avoids losing focus on re-render
    const inp = document.getElementById('brawl-kill-input');
    if (inp) { inp.value = String(brawlKillCount); return; }
    renderUltimateRotation();
}
