// ── imageExport.js ────────────────────────────────────────────────────────────
// PNG export via html2canvas.
// Strategy: manually clone #capture-area into a fixed off-screen container
// at exact pixel dimensions, render THAT, then clean up. This avoids all
// html2canvas internal clone/reflow issues with complex flex layouts.

async function exportCapturePNG() {
    const btn    = document.getElementById('export-png-btn');
    const target = document.getElementById('capture-area');

    if (!target || typeof html2canvas === 'undefined') {
        alert('html2canvas not loaded yet — try again in a moment.');
        return;
    }

    const origHTML = btn.innerHTML;
    btn.innerHTML  = 'Rendering…';
    btn.disabled   = true;

    // Temporary container that we'll render from
    let offscreen = null;

    try {
        const rect = target.getBoundingClientRect();
        const W    = Math.round(rect.width);
        const H    = Math.round(rect.height);

        // ── Step 1: Deep-clone the capture area ──────────────────────────────
        const clone = target.cloneNode(true);

        // ── Step 2: Fix panels — hide whichever panel is inactive ────────────
        const dmgPanel   = document.getElementById('battle-stats-panel');
        const notesPanel = document.getElementById('comments-panel');
        const cloneDmg   = clone.querySelector('#battle-stats-panel');
        const cloneNotes = clone.querySelector('#comments-panel');

        if (cloneDmg && dmgPanel) {
            cloneDmg.style.display = window.getComputedStyle(dmgPanel).display;
        }
        if (cloneNotes) {
            const notesVisible = notesPanel && notesPanel.classList.contains('visible');
            cloneNotes.style.display = notesVisible ? 'flex' : 'none';
        }

        // ── Step 2b: Lock the side-panel column to its exact live pixel width ───
        const livePanelCol  = target.querySelector('#team-stats-wrapper > div:last-child');
        const clonePanelCol = clone.querySelector('#team-stats-wrapper > div:last-child');
        if (livePanelCol && clonePanelCol) {
            const colRect = livePanelCol.getBoundingClientRect();
            const colW    = Math.round(colRect.width);
            const colH    = Math.round(colRect.height);
            clonePanelCol.style.width      = `${colW}px`;
            clonePanelCol.style.minWidth   = `${colW}px`;
            clonePanelCol.style.maxWidth   = `${colW}px`;
            clonePanelCol.style.height     = `${colH}px`;
            clonePanelCol.style.flexShrink = '0';
            clonePanelCol.style.flexGrow   = '0';
        }

        // ── Step 2c: Freeze ult-time-wrapper visibility state ────────────────
        const liveTimeWrappers  = Array.from(target.querySelectorAll('.ult-time-wrapper'));
        const cloneTimeWrappers = Array.from(clone.querySelectorAll('.ult-time-wrapper'));
        liveTimeWrappers.forEach((liveW, idx) => {
            const cloneW = cloneTimeWrappers[idx];
            if (!cloneW) return;
            const isVisible = liveW.classList.contains('visible');
            cloneW.style.transition = 'none';
            if (isVisible) {
                cloneW.style.maxHeight = '40px';
                cloneW.style.opacity   = '1';
                cloneW.style.overflow  = 'visible';
            } else {
                cloneW.style.maxHeight = '0px';
                cloneW.style.opacity   = '0';
                cloneW.style.overflow  = 'hidden';
            }
        });

        // ══════════════════════════════════════════════════════════════════════
        // ── NEW Step 2d: Hide empty slots & fix border-color bleed ────────────
        // ══════════════════════════════════════════════════════════════════════

        // Helper: is a team slot (index) empty?
        const _slotIsEmpty = (i) => !slotData[i] || !slotData[i].character;

        // 1. Hide empty team-grid <section> cards entirely
        const cloneGrid = clone.querySelector('#team-grid');
        if (cloneGrid) {
            const cloneSections = Array.from(cloneGrid.querySelectorAll('section'));
            cloneSections.forEach((sec, i) => {
                if (_slotIsEmpty(i)) {
                    sec.style.display = 'none';
                } else {
                    // Fix background bleed: the section has an inline element-tinted
                    // linear-gradient with semi-transparent colours.  html2canvas composites
                    // that onto a transparent canvas, producing a visible colour wash.
                    // Reset to the plain solid card colour so the export looks clean.
                    sec.style.background      = '#181a24';
                    sec.style.backgroundColor = '#181a24';

                    // Solidify the element-tinted border colour so it renders cleanly.
                    const liveSection = document.querySelector(`#team-grid section[data-index="${i}"]`);
                    if (liveSection) {
                        const liveBorder = window.getComputedStyle(liveSection).borderColor;
                        sec.style.borderColor = liveBorder;
                        sec.style.borderStyle = 'solid';
                    }

                    // Also fix the character portrait container: its inline border uses
                    // a semi-transparent element colour (e.g. #f4728b88) that bleeds.
                    // Replace with the same solid colour at full opacity.
                    const charContainers = sec.querySelectorAll('.relative.rounded-lg.overflow-hidden');
                    charContainers.forEach(cc => {
                        const liveCC = liveSection
                            ? liveSection.querySelectorAll('.relative.rounded-lg.overflow-hidden')[0]
                            : null;
                        if (liveCC) {
                            const ccBorder = window.getComputedStyle(liveCC).borderColor;
                            cc.style.borderColor = ccBorder;
                            cc.style.borderStyle = 'solid';
                        }
                        // Neutral background — the character image covers it fully anyway
                        cc.style.background      = '#20222f';
                        cc.style.backgroundColor = '#20222f';
                    });

                    // Fix the card display area's element-tinted border too
                    const cardContainers = sec.querySelectorAll('.relative.bg-slotBg');
                    cardContainers.forEach(cd => {
                        cd.style.background      = '#20222f';
                        cd.style.backgroundColor = '#20222f';
                        cd.style.borderColor     = '#2d3142';
                        cd.style.borderStyle     = 'solid';
                    });
                }
            });
        }

        // 2. Hide the whole team-stats-wrapper side panel if no damage data
        //    AND notes textarea is empty — keeps the layout tidy
        if (cloneDmg) {
            const hasDmgData  = typeof bstatDealt !== 'undefined' && bstatDealt && bstatDealt.some(r => r.value > 0);
            const notesText   = document.getElementById('comments-textarea')?.value?.trim() || '';
            const notesShown  = notesPanel && notesPanel.classList.contains('visible');
            const hasPanelContent = hasDmgData || (notesShown && notesText.length > 0);
            if (!hasPanelContent) {
                if (clonePanelCol) clonePanelCol.style.display = 'none';
                // Let team-grid expand — remove the fixed width constraints we set above
                const cloneTeamGrid = clone.querySelector('#team-grid');
                if (cloneTeamGrid) cloneTeamGrid.style.flex = '1';
            }
        }

        // 3. Hide empty pet slots
        const petSlotIds = ['p1','p2','p3'];
        petSlotIds.forEach((pid, i) => {
            const clonePetSlot = clone.querySelector(`[onclick*="openModal('${pid}'"]`) ||
                                 clone.querySelector(`[data-pet-idx="${i}"]`);
            if (clonePetSlot && (!petsData[i] || !petsData[i].name)) {
                // Hide the whole pet column (parent of the slot)
                const col = clonePetSlot.closest('.flex.flex-col.gap-2');
                if (col) col.style.display = 'none';
            }
        });

        // 4. Hide empty formation slots (both individual cells and the entire
        //    formation section if every slot is empty)
        const allFormEmpty = formationSlots.every(v => v === -1 || _slotIsEmpty(v));
        if (allFormEmpty) {
            // Hide the entire right-side formation panel
            const formSection = clone.querySelector('.flex-1.flex.flex-col.gap-2');
            // Walk up from form-slot-0 to find the formation container
            const formSlot0 = clone.querySelector('#form-slot-0');
            if (formSlot0) {
                // Go up to the flex column that holds both TOP/BOT rows
                const formParent = formSlot0.closest('.flex.flex-col.gap-1');
                if (formParent) {
                    const formContainer = formParent.parentElement;
                    if (formContainer) formContainer.style.display = 'none';
                }
            }
        }

        // 5. Hide empty ultimate rotation slots AND the entire rotation section
        //    if no characters are assigned
        const hasAnyRotation = ultimateRotation.some(s => s.character);
        const cloneUltContainer = clone.querySelector('#ultimate-rotation-container');
        const cloneUltSection   = cloneUltContainer?.closest('.border-t.border-borderCool');
        if (!hasAnyRotation) {
            if (cloneUltSection) cloneUltSection.style.display = 'none';
        } else if (cloneUltContainer) {
            // Hide individual empty rotation slot wrappers (the .ult-rotation-slot divs)
            // but keep arrows between filled slots — we rebuild them
            const liveUltSlots  = Array.from(document.querySelectorAll('.ult-rotation-slot'));
            const cloneUltSlots = Array.from(cloneUltContainer.querySelectorAll('.ult-rotation-slot'));
            cloneUltSlots.forEach((cloneSlot) => {
                const idx = parseInt(cloneSlot.dataset.ultIdx);
                if (isNaN(idx)) return;
                const slotEntry = ultimateRotation[idx];
                if (!slotEntry || !slotEntry.character) {
                    // Also hide the arrow that immediately follows this slot
                    const nextSibling = cloneSlot.nextElementSibling;
                    if (nextSibling && nextSibling.classList.contains('ult-arrow')) {
                        nextSibling.style.display = 'none';
                    }
                    cloneSlot.style.display = 'none';
                }
            });
        }

        // ══════════════════════════════════════════════════════════════════════
        // ── Step 3: Replace textareas AND text inputs with divs ──────────────
        // ══════════════════════════════════════════════════════════════════════
        function replaceFormControlWithDiv(cloneEl, liveEl) {
            const value = liveEl ? liveEl.value : '';
            const cs    = liveEl ? window.getComputedStyle(liveEl) : null;
            const div   = document.createElement('div');
            if (cs) {
                [
                    'width','height','minHeight','maxHeight','boxSizing',
                    'padding','paddingTop','paddingBottom','paddingLeft','paddingRight',
                    'fontSize','fontWeight','fontFamily','lineHeight','letterSpacing',
                    'color','backgroundColor','background',
                    'border','borderColor','borderWidth','borderStyle','borderRadius',
                    'whiteSpace','wordBreak','overflowWrap','textAlign',
                    'flexShrink','flexGrow','flexBasis',
                ].forEach(p => { try { div.style[p] = cs[p]; } catch(_){} });
            }
            div.style.display        = 'flex';
            div.style.alignItems     = 'center';
            div.style.justifyContent = 'center';
            div.style.overflow       = 'hidden';
            if (value.trim() === '') {
                div.textContent     = cloneEl.getAttribute('placeholder') || '';
                div.style.color     = '#475569';
                div.style.fontStyle = 'italic';
            } else {
                div.textContent = value;
            }
            cloneEl.parentNode.replaceChild(div, cloneEl);
        }

        const liveTAs = Array.from(target.querySelectorAll('textarea'));
        Array.from(clone.querySelectorAll('textarea')).forEach((cloneTa, idx) => {
            replaceFormControlWithDiv(cloneTa, liveTAs[idx] || null);
        });

        const liveInputs = Array.from(target.querySelectorAll('input[type="text"], input:not([type])'));
        Array.from(clone.querySelectorAll('input[type="text"], input:not([type])')).forEach((cloneIn, idx) => {
            replaceFormControlWithDiv(cloneIn, liveInputs[idx] || null);
        });

        // ── Step 4: Replace FA icons with rendered Unicode spans ─────────────
        // html2canvas cannot load the FA webfont but CAN render text nodes that
        // are already painted by the browser.  We snapshot each icon's computed
        // size/color from the live DOM counterpart, then replace the cloned <i>
        // with a <span> whose textContent is the FA Unicode codepoint and whose
        // font-family forces the correct FA subset.  Icons that have no mapping
        // below fall back to a zero-size invisible span to preserve flex layout.
        const FA_UNICODE = {
            // Solid
            'fa-chart-bar':         '\uf080',
            'fa-note-sticky':       '\uf249',
            'fa-upload':            '\uf093',
            'fa-clipboard':         '\uf328',
            'fa-user-plus':         '\uf234',
            'fa-xmark':             '\uf00d',
            'fa-check':             '\uf00c',
            'fa-trash':             '\uf1f8',
            'fa-trash-can':         '\uf2ed',
            'fa-floppy-disk':       '\uf0c7',
            'fa-folder-open':       '\uf07c',
            'fa-folder':            '\uf07b',
            'fa-image':             '\uf03e',
            'fa-share-nodes':       '\uf1e0',
            'fa-arrow-rotate-right':'\uf01e',
            'fa-redo':              '\uf01e',
            'fa-arrows-rotate':     '\uf021',
            'fa-chevron-down':      '\uf078',
            'fa-chevron-right':     '\uf054',
            'fa-file-import':       '\uf56f',
            'fa-file-code':         '\uf1c9',
            'fa-qrcode':            '\uf029',
            'fa-clone':             '\uf24d',
            'fa-layer-group':       '\uf5fd',
            'fa-fire':              '\uf06d',
            'fa-shield-halved':     '\ue23b',
            'fa-circle-info':       '\uf05a',
            'fa-copy':              '\uf0c5',
            'fa-list-ol':           '\uf0cb',
            'fa-rotate-left':       '\uf2ea',
            'fa-shirt':             '\ue406',
            'fa-dragon':            '\uf6d5',
            'fa-chart-area':        '\uf1fe',
            'fa-arrow-up':          '\uf062',
            'fa-arrow-down':        '\uf063',
            'fa-lock':              '\uf023',
            'fa-square-check':      '\uf14a',
        };
        // Which FA subset owns each icon (determines font-family string)
        const FA_FONT = {
            'fa-square-check': '"Font Awesome 6 Free"',
        };
        const DEFAULT_FA_FONT = '"Font Awesome 6 Free"';

        // Build a parallel list of live <i> elements so we can read computed styles
        const liveIcons  = Array.from(target.querySelectorAll('i[class*="fa-"]'));
        const cloneIcons = Array.from(clone.querySelectorAll('i[class*="fa-"]'));

        cloneIcons.forEach((cloneIcon, idx) => {
            const liveIcon = liveIcons[idx];
            // Identify the icon name from the class list
            const iconClass = Array.from(cloneIcon.classList).find(c => c.startsWith('fa-') && c !== 'fa-solid' && c !== 'fa-regular' && c !== 'fa-brands');
            const unicode   = iconClass ? FA_UNICODE[iconClass] : null;

            const span = document.createElement('span');

            if (unicode) {
                // Read computed style from the live counterpart for accurate size/color
                const cs = liveIcon ? window.getComputedStyle(liveIcon) : null;
                span.textContent = unicode;
                span.style.fontFamily  = FA_FONT[iconClass] || DEFAULT_FA_FONT;
                span.style.fontWeight  = '900';  // "Solid" weight
                span.style.fontStyle   = 'normal';
                span.style.fontSize    = cs ? cs.fontSize    : '1em';
                span.style.color       = cs ? cs.color       : 'inherit';
                span.style.lineHeight  = cs ? cs.lineHeight  : '1';
                span.style.display     = 'inline-block';
                span.style.flexShrink  = '0';
                span.style.verticalAlign = 'middle';
                // Preserve any explicit inline size overrides from the original
                if (cloneIcon.style.fontSize)  span.style.fontSize  = cloneIcon.style.fontSize;
                if (cloneIcon.style.color)      span.style.color     = cloneIcon.style.color;
            } else {
                // Unknown icon — zero-size invisible placeholder preserves flex layout
                span.style.cssText = 'display:inline-block;width:0;height:0;overflow:hidden;visibility:hidden;flex-shrink:0;';
            }

            cloneIcon.parentNode.replaceChild(span, cloneIcon);
        });

        // ── Step 5: Copy ALL computed styles from every live element to clone ─
        const liveAll  = Array.from(target.querySelectorAll('*'));
        const cloneAll = Array.from(clone.querySelectorAll('*'));

        const PROPS = [
            'display','visibility',
            'flexDirection','alignItems','justifyContent','alignSelf','justifySelf',
            'flexWrap','flexGrow','flexShrink','flexBasis',
            'gap','rowGap','columnGap',
            'padding','paddingTop','paddingBottom','paddingLeft','paddingRight',
            'margin','marginTop','marginBottom','marginLeft','marginRight',
            'width','height','minWidth','minHeight','maxWidth','maxHeight',
            'boxSizing','position','top','left','right','bottom','zIndex',
            'fontSize','fontWeight','fontFamily','lineHeight','letterSpacing',
            'textAlign','verticalAlign','color','opacity',
            'borderRadius','overflow','overflowX','overflowY',
            'objectFit','objectPosition',
            'background','backgroundColor','backgroundImage','backgroundSize','backgroundPosition',
            'border','borderColor','borderWidth','borderStyle',
            'borderTop','borderRight','borderBottom','borderLeft',
            'transform','transformOrigin',
            'whiteSpace','wordBreak','overflowWrap',
            'textDecoration','textTransform',
            'gridTemplateColumns','gridTemplateRows','gridColumn','gridRow',
            'boxShadow',
        ];

        liveAll.forEach((liveEl, i) => {
            const cloneEl = cloneAll[i];
            if (!cloneEl || liveEl.tagName === 'TEXTAREA') return;
            const cs = window.getComputedStyle(liveEl);
            PROPS.forEach(prop => {
                try { cloneEl.style[prop] = cs[prop]; } catch(_) {}
            });
            try { cloneEl.style.transition = 'none'; } catch(_) {}
        });

        // ── Step 5c: Force clone root to transparent background ───────────────
        clone.style.background      = 'transparent';
        clone.style.backgroundColor = 'transparent';

        // ── Step 5b: Replace <img> elements with background-image divs ──────────
        liveAll.forEach((liveEl, i) => {
            if (liveEl.tagName !== 'IMG') return;
            const cloneEl = cloneAll[i];
            if (!cloneEl) return;

            const cs        = window.getComputedStyle(liveEl);
            const transform = cs.transform || cs.webkitTransform || '';
            const objFit    = cs.objectFit || '';
            const objPos    = liveEl.style.objectPosition || cs.objectPosition || '';

            const isScaled   = transform && transform !== 'none' && transform !== 'matrix(1, 0, 0, 1, 0, 0)';
            const hasObjFit  = objFit === 'cover' || objFit === 'contain';
            if (!isScaled && !hasObjFit) return;

            const src = liveEl.src || liveEl.getAttribute('src') || '';
            if (!src) return;

            let bgSize;
            if (isScaled) {
                let scale = 1;
                const matMatch = transform.match(/matrix\(([^,]+)/);
                if (matMatch) scale = parseFloat(matMatch[1]) || 1;
                bgSize = `${Math.round(scale * 100)}%`;
            } else if (objFit === 'cover') {
                bgSize = 'cover';
            } else {
                bgSize = 'contain';
            }

            let bgPosX = '50%';
            let bgPosY = '50%';

            if (isScaled) {
                const originRaw   = cs.transformOrigin || '50% 50%';
                const originParts = originRaw.split(' ');
                bgPosX = originParts[0] || '50%';
                bgPosY = originParts[1] || '50%';
                if (bgPosX === 'center') bgPosX = '50%';
                if (bgPosY === 'center') bgPosY = '50%';
            }

            if (objPos && objPos !== 'auto') {
                const pp = objPos.trim().split(/\s+/);
                if (pp[0]) bgPosX = pp[0];
                if (pp[1]) bgPosY = pp[1];
            }

            const div = document.createElement('div');
            div.style.cssText = cloneEl.style.cssText;
            div.style.backgroundImage    = `url("${src}")`;
            div.style.backgroundSize     = bgSize;
            div.style.backgroundPosition = `${bgPosX} ${bgPosY}`;
            div.style.backgroundRepeat   = 'no-repeat';
            div.style.display    = cs.display === 'inline' ? 'inline-block' : (cs.display || 'block');
            div.style.width      = cs.width;
            div.style.height     = cs.height;
            div.style.minWidth   = cs.minWidth;
            div.style.minHeight  = cs.minHeight;
            div.style.flexShrink = cs.flexShrink;
            div.style.flexGrow   = cs.flexGrow;
            div.style.flexBasis  = cs.flexBasis;
            div.style.borderRadius = cs.borderRadius;
            div.style.overflow   = 'hidden';
            div.style.transform  = 'none';

            cloneEl.parentNode.replaceChild(div, cloneEl);
            cloneAll[i] = div;
        });

        // ── Step 6: Place clone in a fixed off-screen wrapper ────────────────
        offscreen = document.createElement('div');
        offscreen.style.cssText = [
            'position: fixed',
            'top: 0',
            'left: -99999px',
            `width: ${W}px`,
            `height: ${H}px`,
            'overflow: visible',
            'pointer-events: none',
            'z-index: -1',
            'background: transparent',
        ].join('; ');

        clone.style.cssText += `; width:${W}px; max-width:${W}px; height:auto;`;

        offscreen.appendChild(clone);
        document.body.appendChild(offscreen);

        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

        // ── Step 7: Inject inline-block fix for html2canvas measurement div ──
        const h2cFix = document.createElement('style');
        h2cFix.textContent = 'body > div:last-child img { display: inline-block !important; }';
        document.head.appendChild(h2cFix);

        // ── Step 8: Render the off-screen clone ──────────────────────────────
        const canvas = await html2canvas(clone, {
            useCORS:         true,
            allowTaint:      false,
            backgroundColor: null,
            scale:           2,
            logging:         false,
            imageTimeout:    0,
            scrollX:         0,
            scrollY:         0,
            onclone: (doc) => {
                const s = doc.createElement('style');
                s.textContent = 'img { display: inline-block !important; }';
                doc.head.appendChild(s);
                const ca = doc.getElementById('capture-area');
                if (ca) { ca.style.background = 'transparent'; ca.style.backgroundColor = 'transparent'; }
                // Step 4 already converted <i> tags to Unicode <span> tags in our pre-processed
                // clone, so by the time html2canvas clones it there should be no <i> left.
                // Zero out any stragglers just in case.
                doc.querySelectorAll('i[class*="fa-"]').forEach(icon => {
                    const sp = doc.createElement('span');
                    sp.style.cssText = 'display:inline-block;width:0;height:0;overflow:hidden;visibility:hidden;flex-shrink:0;';
                    icon.parentNode.replaceChild(sp, icon);
                });
            }
        });

        h2cFix.remove();

        // ── Step 9: Download ─────────────────────────────────────────────────
        const dataUrl = canvas.toDataURL('image/png');
        const title   = (document.querySelector('h1[contenteditable]')?.innerText?.trim() || 'LSTB_Team')
            .replace(/[^a-zA-Z0-9\s_-]/g, '').replace(/\s+/g, '_').substring(0, 40) || 'LSTB_Team';
        const dateStr = new Date().toISOString().slice(0, 10);

        const link    = document.createElement('a');
        link.download = `${title}_${dateStr}.png`;
        link.href     = dataUrl;
        link.click();

        btn.innerHTML         = 'Saved!';
        btn.style.borderColor = '#059669';
        btn.style.color       = '#34d399';
        setTimeout(() => {
            btn.innerHTML         = origHTML;
            btn.disabled          = false;
            btn.style.borderColor = '';
            btn.style.color       = '';
        }, 2200);

    } catch (err) {
        console.error('[Export PNG]', err);
        alert('Export failed: ' + err.message);
        btn.innerHTML = origHTML;
        btn.disabled  = false;
    } finally {
        if (offscreen && offscreen.parentNode) offscreen.parentNode.removeChild(offscreen);
    }
}
