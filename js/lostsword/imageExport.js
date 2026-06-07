// imageExport.js
// PNG export via html2canvas.
// All slot/section hiding happens in Step 5d, AFTER the computed-style copy
// loop (Step 5) -- otherwise Step 5 overwrites the display:none values.

async function exportCapturePNG() {
    const btn    = document.getElementById('export-png-btn');
    const target = document.getElementById('capture-area');

    if (!target || typeof html2canvas === 'undefined') {
        alert('html2canvas not loaded yet -- try again in a moment.');
        return;
    }

    const origHTML = btn.innerHTML;
    btn.innerHTML  = 'Rendering...';
    btn.disabled   = true;

    let offscreen = null;

    try {
        const rect = target.getBoundingClientRect();
        const W    = Math.round(rect.width);
        const H    = Math.round(rect.height);

        // Step 1: Deep-clone the capture area
        const clone = target.cloneNode(true);

        // Step 2: Fix panels -- show/hide damage vs notes
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

        // Step 2b: Lock side-panel column to its exact live pixel width
        const livePanelCol  = target.querySelector('#team-stats-wrapper > div:last-child');
        const clonePanelCol = clone.querySelector('#team-stats-wrapper > div:last-child');
        if (livePanelCol && clonePanelCol) {
            const colRect = livePanelCol.getBoundingClientRect();
            const colW    = Math.round(colRect.width);
            const colH    = Math.round(colRect.height);
            clonePanelCol.style.width      = colW + 'px';
            clonePanelCol.style.minWidth   = colW + 'px';
            clonePanelCol.style.maxWidth   = colW + 'px';
            clonePanelCol.style.height     = colH + 'px';
            clonePanelCol.style.flexShrink = '0';
            clonePanelCol.style.flexGrow   = '0';
        }

        // Step 2c: Freeze ult-time-wrapper open/closed state
        const liveTimeWrappers  = Array.from(target.querySelectorAll('.ult-time-wrapper'));
        const cloneTimeWrappers = Array.from(clone.querySelectorAll('.ult-time-wrapper'));
        liveTimeWrappers.forEach(function(liveW, idx) {
            var cloneW = cloneTimeWrappers[idx];
            if (!cloneW) return;
            var isVisible = liveW.classList.contains('visible');
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

        // Step 3: Replace textareas + text inputs with static divs
        // (html2canvas cannot read .value on form controls)
        function replaceFormControlWithDiv(cloneEl, liveEl, isTextarea) {
            var value = liveEl ? liveEl.value : '';
            var cs    = liveEl ? window.getComputedStyle(liveEl) : null;
            var div   = document.createElement('div');
            if (cs) {
                ['width','height','minHeight','maxHeight','boxSizing',
                 'padding','paddingTop','paddingBottom','paddingLeft','paddingRight',
                 'fontSize','fontWeight','fontFamily','lineHeight','letterSpacing',
                 'color','backgroundColor','background',
                 'border','borderColor','borderWidth','borderStyle','borderRadius',
                 'whiteSpace','wordBreak','overflowWrap','textAlign',
                 'flexShrink','flexGrow','flexBasis'].forEach(function(p) {
                    try { div.style[p] = cs[p]; } catch(e) {}
                });
            }
            if (isTextarea) {
                // Preserve top-left text layout for multi-line text areas
                div.style.display     = 'block';
                div.style.overflow    = 'hidden';
                div.style.whiteSpace  = 'pre-wrap';
                div.style.wordBreak   = 'break-word';
                div.style.verticalAlign = 'top';
            } else {
                // Small single-line inputs (time, kill count etc.) — center is fine
                div.style.display        = 'flex';
                div.style.alignItems     = 'center';
                div.style.justifyContent = 'center';
                div.style.overflow       = 'hidden';
            }
            if (value.trim() === '') {
                div.textContent     = cloneEl.getAttribute('placeholder') || '';
                div.style.color     = '#475569';
                div.style.fontStyle = 'italic';
            } else {
                div.textContent = value;
            }
            cloneEl.parentNode.replaceChild(div, cloneEl);
        }

        var liveTAs = Array.from(target.querySelectorAll('textarea'));
        Array.from(clone.querySelectorAll('textarea')).forEach(function(cloneTa, idx) {
            replaceFormControlWithDiv(cloneTa, liveTAs[idx] || null, true);
        });

        var liveInputs = Array.from(target.querySelectorAll('input[type="text"], input:not([type])'));
        Array.from(clone.querySelectorAll('input[type="text"], input:not([type])')).forEach(function(cloneIn, idx) {
            replaceFormControlWithDiv(cloneIn, liveInputs[idx] || null, false);
        });

        // Step 4: Replace FA icons with rendered Unicode spans
        // html2canvas can rasterize text nodes using already-loaded fonts.
        var FA_UNICODE = {
            'fa-chart-bar':          '\uf080',
            'fa-note-sticky':        '\uf249',
            'fa-upload':             '\uf093',
            'fa-clipboard':          '\uf328',
            'fa-user-plus':          '\uf234',
            'fa-xmark':              '\uf00d',
            'fa-check':              '\uf00c',
            'fa-trash':              '\uf1f8',
            'fa-trash-can':          '\uf2ed',
            'fa-floppy-disk':        '\uf0c7',
            'fa-folder-open':        '\uf07c',
            'fa-folder':             '\uf07b',
            'fa-image':              '\uf03e',
            'fa-share-nodes':        '\uf1e0',
            'fa-arrow-rotate-right': '\uf01e',
            'fa-redo':               '\uf01e',
            'fa-arrows-rotate':      '\uf021',
            'fa-chevron-down':       '\uf078',
            'fa-chevron-right':      '\uf054',
            'fa-file-import':        '\uf56f',
            'fa-file-code':          '\uf1c9',
            'fa-qrcode':             '\uf029',
            'fa-clone':              '\uf24d',
            'fa-layer-group':        '\uf5fd',
            'fa-fire':               '\uf06d',
            'fa-shield-halved':      '\ue23b',
            'fa-circle-info':        '\uf05a',
            'fa-copy':               '\uf0c5',
            'fa-list-ol':            '\uf0cb',
            'fa-rotate-left':        '\uf2ea',
            'fa-shirt':              '\ue406',
            'fa-dragon':             '\uf6d5',
            'fa-chart-area':         '\uf1fe',
            'fa-arrow-up':           '\uf062',
            'fa-arrow-down':         '\uf063',
            'fa-lock':               '\uf023',
            'fa-square-check':       '\uf14a',
        };
        var FA_FONT_FAMILY = '"Font Awesome 6 Free"';

        var liveIcons  = Array.from(target.querySelectorAll('i[class*="fa-"]'));
        var cloneIcons = Array.from(clone.querySelectorAll('i[class*="fa-"]'));

        cloneIcons.forEach(function(cloneIcon, idx) {
            var liveIcon  = liveIcons[idx];
            var iconClass = Array.from(cloneIcon.classList).find(function(c) {
                return c.startsWith('fa-') && c !== 'fa-solid' && c !== 'fa-regular' && c !== 'fa-brands';
            });
            var unicode = iconClass ? FA_UNICODE[iconClass] : null;
            var span    = document.createElement('span');

            if (unicode) {
                var cs = liveIcon ? window.getComputedStyle(liveIcon) : null;
                span.textContent           = unicode;
                span.style.fontFamily      = FA_FONT_FAMILY;
                span.style.fontWeight      = '900';
                span.style.fontStyle       = 'normal';
                span.style.fontSize        = cs ? cs.fontSize   : '1em';
                span.style.color           = cs ? cs.color      : 'inherit';
                span.style.lineHeight      = cs ? cs.lineHeight : '1';
                span.style.display         = 'inline-block';
                span.style.flexShrink      = '0';
                span.style.verticalAlign   = 'middle';
                if (cloneIcon.style.fontSize) span.style.fontSize = cloneIcon.style.fontSize;
                if (cloneIcon.style.color)    span.style.color    = cloneIcon.style.color;
            } else {
                span.style.cssText = 'display:inline-block;width:0;height:0;overflow:hidden;visibility:hidden;flex-shrink:0;';
            }

            cloneIcon.parentNode.replaceChild(span, cloneIcon);
        });

        // Step 5: Copy ALL computed styles from live tree to clone
        var liveAll  = Array.from(target.querySelectorAll('*'));
        var cloneAll = Array.from(clone.querySelectorAll('*'));

        var PROPS = [
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

        liveAll.forEach(function(liveEl, i) {
            var cloneEl = cloneAll[i];
            if (!cloneEl || liveEl.tagName === 'TEXTAREA') return;
            var cs = window.getComputedStyle(liveEl);
            PROPS.forEach(function(prop) {
                try { cloneEl.style[prop] = cs[prop]; } catch(e) {}
            });
            try { cloneEl.style.transition = 'none'; } catch(e) {}
        });

        // Step 5c: Force root transparent (no dark body background in PNG)
        clone.style.background      = 'transparent';
        clone.style.backgroundColor = 'transparent';

        // Step 5b: Replace <img> with background-image divs so object-fit/transform work
        liveAll.forEach(function(liveEl, i) {
            if (liveEl.tagName !== 'IMG') return;
            var cloneEl = cloneAll[i];
            if (!cloneEl) return;

            var cs        = window.getComputedStyle(liveEl);
            var transform = cs.transform || cs.webkitTransform || '';
            var objFit    = cs.objectFit || '';
            var objPos    = liveEl.style.objectPosition || cs.objectPosition || '';

            var isScaled  = transform && transform !== 'none' && transform !== 'matrix(1, 0, 0, 1, 0, 0)';
            var hasObjFit = objFit === 'cover' || objFit === 'contain';
            if (!isScaled && !hasObjFit) return;

            var src = liveEl.src || liveEl.getAttribute('src') || '';
            if (!src) return;

            var bgSize;
            if (isScaled) {
                var scale    = 1;
                var matMatch = transform.match(/matrix\(([^,]+)/);
                if (matMatch) scale = parseFloat(matMatch[1]) || 1;
                bgSize = Math.round(scale * 100) + '%';
            } else if (objFit === 'cover') {
                bgSize = 'cover';
            } else {
                bgSize = 'contain';
            }

            var bgPosX = '50%', bgPosY = '50%';
            if (isScaled) {
                var originParts = (cs.transformOrigin || '50% 50%').split(' ');
                bgPosX = originParts[0] || '50%';
                bgPosY = originParts[1] || '50%';
                if (bgPosX === 'center') bgPosX = '50%';
                if (bgPosY === 'center') bgPosY = '50%';
            }
            if (objPos && objPos !== 'auto') {
                var pp = objPos.trim().split(/\s+/);
                if (pp[0]) bgPosX = pp[0];
                if (pp[1]) bgPosY = pp[1];
            }

            var div = document.createElement('div');
            div.style.cssText            = cloneEl.style.cssText;
            div.style.backgroundImage    = 'url("' + src + '")';
            div.style.backgroundSize     = bgSize;
            div.style.backgroundPosition = bgPosX + ' ' + bgPosY;
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

        // =====================================================================
        // Step 5d: Fix backgrounds/borders, hide only individual empty item
        // slots — NEVER hide whole sections or the grid itself.
        // Runs AFTER Step 5 so the style-copy loop can't overwrite these.
        // =====================================================================

        function slotIsEmpty(i) { return !slotData[i] || !slotData[i].character; }

        // 1. Team-grid sections — always keep section cards visible.
        //    For filled slots: fix backgrounds/borders that composite badly.
        //    For empty slots: hide only the clickable sub-areas (portrait,
        //    gear squares, card area) so the card shell stays as a placeholder.
        var cloneGridFinal = clone.querySelector('#team-grid');
        if (cloneGridFinal) {
            Array.from(cloneGridFinal.querySelectorAll('section')).forEach(function(sec, i) {
                // Always fix section background (gradient composites badly on transparent canvas)
                sec.style.background      = '#181a24';
                sec.style.backgroundColor = '#181a24';
                sec.style.backgroundImage = 'none';

                var liveSec = document.querySelector('#team-grid section[data-index="' + i + '"]');
                if (liveSec) {
                    sec.style.borderColor = window.getComputedStyle(liveSec).borderColor;
                    sec.style.borderStyle = 'solid';
                }

                if (slotIsEmpty(i)) {
                    // Hide the interactive add-character area and all gear/card slots
                    // but keep the section card itself visible
                    var portraitArea = sec.querySelector('[id^="char-display-"]');
                    if (portraitArea && portraitArea.parentElement) {
                        portraitArea.parentElement.style.visibility = 'hidden';
                    }
                    var gearGrid = sec.querySelector('.grid.grid-cols-2');
                    if (gearGrid) gearGrid.style.visibility = 'hidden';
                    var cardArea = sec.querySelector('[id^="card-display-"]');
                    if (cardArea && cardArea.parentElement) {
                        cardArea.parentElement.style.visibility = 'hidden';
                    }
                    // Also hide the off/def buttons
                    var offBtn = sec.querySelector('[id^="slot-off-btn-"]');
                    if (offBtn) offBtn.style.visibility = 'hidden';
                    var defBtn = sec.querySelector('[id^="slot-def-btn-"]');
                    if (defBtn) defBtn.style.visibility = 'hidden';
                    return;
                }

                // Filled slot — fix portrait and card container backgrounds
                var livePortraitDiv = liveSec ? liveSec.querySelector('.relative.rounded-lg.overflow-hidden') : null;
                Array.from(sec.querySelectorAll('.relative.rounded-lg.overflow-hidden')).forEach(function(pd) {
                    pd.style.background      = '#20222f';
                    pd.style.backgroundColor = '#20222f';
                    pd.style.backgroundImage = 'none';
                    if (livePortraitDiv) {
                        pd.style.borderColor = window.getComputedStyle(livePortraitDiv).borderColor;
                        pd.style.borderStyle = 'solid';
                    }
                });
                Array.from(sec.querySelectorAll('.relative.bg-slotBg')).forEach(function(cd) {
                    cd.style.background      = '#20222f';
                    cd.style.backgroundColor = '#20222f';
                    cd.style.backgroundImage = 'none';
                    cd.style.borderColor     = '#2d3142';
                    cd.style.borderStyle     = 'solid';
                });
            });
        }

        // 2. Side panel (damage/notes) -- hide if no content
        var hasDmgData   = typeof bstatDealt !== 'undefined' && bstatDealt && bstatDealt.some(function(r) { return r.value > 0; });
        var notesTextEl  = document.getElementById('comments-textarea');
        var notesText    = notesTextEl ? notesTextEl.value.trim() : '';
        var notesShown   = document.getElementById('comments-panel') && document.getElementById('comments-panel').classList.contains('visible');
        var hasSideContent = hasDmgData || (notesShown && notesText.length > 0);

        var clonePanelFinal = clone.querySelector('#team-stats-wrapper > div:last-child');
        if (!hasSideContent && clonePanelFinal) {
            clonePanelFinal.style.display    = 'none';
            clonePanelFinal.style.visibility = 'hidden';
            var cGrid = clone.querySelector('#team-grid');
            if (cGrid) cGrid.style.flex = '1';
        }

        // 3. Pet slots — hide only the empty item squares, keep pet columns visible
        for (var pi = 0; pi < 3; pi++) {
            var petNum = pi + 1;
            var gems = (petsData[pi] && petsData[pi].gems) || [null, null, null, null];

            if (petsData[pi] && petsData[pi].name) {
                // Pet filled — hide individual empty gem cells only
                for (var gi = 0; gi < 4; gi++) {
                    var gemCellEl = clone.querySelector('#gem-p' + petNum + '-' + gi);
                    if (!gemCellEl) continue;
                    var gemCellParent = gemCellEl.parentElement;
                    if (!gems[gi] && gemCellParent) {
                        gemCellParent.style.visibility = 'hidden';
                    }
                }
            } else {
                // Pet empty — hide the pet image slot content but keep column
                var petSlotEl = clone.querySelector('[data-pet-idx="' + pi + '"]');
                if (petSlotEl) petSlotEl.style.visibility = 'hidden';
                // Hide all gem cells too
                for (var gi2 = 0; gi2 < 4; gi2++) {
                    var gc = clone.querySelector('#gem-p' + petNum + '-' + gi2);
                    if (gc && gc.parentElement) gc.parentElement.style.visibility = 'hidden';
                }
                var gemBadge = clone.querySelector('#gem-stat-badge-' + pi);
                if (gemBadge) gemBadge.style.visibility = 'hidden';
            }
        }

        // 4. Formation slots — hide only empty individual cells, keep section
        for (var fi = 0; fi < 6; fi++) {
            var fsEl = clone.querySelector('#form-slot-' + fi);
            if (!fsEl) continue;
            var fVal = formationSlots[fi];
            if (fVal === -1 || slotIsEmpty(fVal)) {
                fsEl.style.visibility = 'hidden';
            }
        }

        // 5. Ultimate rotation — hide only empty individual slots/arrows
        var cloneUltCont = clone.querySelector('#ultimate-rotation-container');
        if (cloneUltCont) {
            Array.from(cloneUltCont.querySelectorAll('.ult-rotation-slot')).forEach(function(slot) {
                var idx = parseInt(slot.dataset.ultIdx);
                if (!isNaN(idx) && ultimateRotation[idx] && ultimateRotation[idx].character) return;
                slot.style.visibility = 'hidden';
                var next = slot.nextElementSibling;
                if (next && next.classList.contains('ult-arrow')) next.style.visibility = 'hidden';
            });
        }

        // =====================================================================

        // Step 6: Place clone in a fixed off-screen wrapper
        offscreen = document.createElement('div');
        offscreen.style.cssText = [
            'position: fixed',
            'top: 0',
            'left: -99999px',
            'width: ' + W + 'px',
            'height: ' + H + 'px',
            'overflow: visible',
            'pointer-events: none',
            'z-index: -1',
            'background: transparent',
        ].join('; ');

        clone.style.cssText += '; width:' + W + 'px; max-width:' + W + 'px; height:auto;';

        offscreen.appendChild(clone);
        document.body.appendChild(offscreen);

        await new Promise(function(r) { requestAnimationFrame(function() { requestAnimationFrame(r); }); });

        // Step 7: Inline-block fix for html2canvas measurement
        var h2cFix = document.createElement('style');
        h2cFix.textContent = 'body > div:last-child img { display: inline-block !important; }';
        document.head.appendChild(h2cFix);

        // Step 8: Render
        var canvas = await html2canvas(clone, {
            useCORS:         true,
            allowTaint:      false,
            backgroundColor: null,
            scale:           2,
            logging:         false,
            imageTimeout:    0,
            scrollX:         0,
            scrollY:         0,
            onclone: function(doc) {
                var s = doc.createElement('style');
                s.textContent = 'img { display: inline-block !important; }';
                doc.head.appendChild(s);
                var ca = doc.getElementById('capture-area');
                if (ca) { ca.style.background = 'transparent'; ca.style.backgroundColor = 'transparent'; }
                // Zero out any <i> that survived (Step 4 converted them but just in case)
                doc.querySelectorAll('i[class*="fa-"]').forEach(function(icon) {
                    var sp = doc.createElement('span');
                    sp.style.cssText = 'display:inline-block;width:0;height:0;overflow:hidden;visibility:hidden;flex-shrink:0;';
                    icon.parentNode.replaceChild(sp, icon);
                });
            }
        });

        h2cFix.remove();

        // Step 9: Download
        var dataUrl = canvas.toDataURL('image/png');
        var title   = (document.querySelector('h1[contenteditable]').innerText.trim() || 'LSTB_Team')
            .replace(/[^a-zA-Z0-9\s_-]/g, '').replace(/\s+/g, '_').substring(0, 40) || 'LSTB_Team';
        var dateStr = new Date().toISOString().slice(0, 10);

        var link    = document.createElement('a');
        link.download = title + '_' + dateStr + '.png';
        link.href     = dataUrl;
        link.click();

        btn.innerHTML         = 'Saved!';
        btn.style.borderColor = '#059669';
        btn.style.color       = '#34d399';
        setTimeout(function() {
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
