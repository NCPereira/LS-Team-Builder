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

        // Panels are managed entirely in step 5d below — don't touch display here.

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
        function replaceFormControlWithDiv(cloneEl, liveEl) {
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
            var isTextarea = cloneEl.tagName === 'TEXTAREA';
            if (isTextarea) {
                // Textarea: block layout, text starts top-left, newlines preserved
                div.style.display      = 'block';
                div.style.overflow     = 'hidden';
                div.style.whiteSpace   = 'pre-wrap';
                div.style.wordBreak    = 'break-word';
                div.style.verticalAlign = 'top';
                div.style.textAlign    = 'left';
                if (value.trim() === '') {
                    div.textContent     = cloneEl.getAttribute('placeholder') || '';
                    div.style.color     = '#475569';
                    div.style.fontStyle = 'italic';
                } else {
                    div.textContent = value;
                }
            } else {
                // Single-line inputs: centred as before
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
            }
            cloneEl.parentNode.replaceChild(div, cloneEl);
        }

        var liveTAs = Array.from(target.querySelectorAll('textarea'));
        Array.from(clone.querySelectorAll('textarea')).forEach(function(cloneTa, idx) {
            replaceFormControlWithDiv(cloneTa, liveTAs[idx] || null);
        });

        var liveInputs = Array.from(target.querySelectorAll('input[type="text"], input:not([type])'));
        Array.from(clone.querySelectorAll('input[type="text"], input:not([type])')).forEach(function(cloneIn, idx) {
            replaceFormControlWithDiv(cloneIn, liveInputs[idx] || null);
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

        // Collect all descendants of the two managed panels so Step 5 never
        // overwrites their display/visibility (we set those explicitly in step 5d).
        var _notesPanelLive  = document.getElementById('comments-panel');
        var _dmgPanelLive    = document.getElementById('battle-stats-panel');
        var _sidePanelColLive = document.querySelector('#team-stats-wrapper > div:last-child');
        var _managedLiveSet  = new Set();
        function _addDescendants(root) {
            if (!root) return;
            _managedLiveSet.add(root);
            root.querySelectorAll('*').forEach(function(el) { _managedLiveSet.add(el); });
        }
        _addDescendants(_notesPanelLive);
        _addDescendants(_dmgPanelLive);
        _addDescendants(_sidePanelColLive);

        liveAll.forEach(function(liveEl, i) {
            var cloneEl = cloneAll[i];
            if (!cloneEl || liveEl.tagName === 'TEXTAREA') return;
            var cs = window.getComputedStyle(liveEl);
            var isManaged = _managedLiveSet.has(liveEl);
            PROPS.forEach(function(prop) {
                // Never copy display/visibility for the panels we own in step 5d —
                // includes the panel root AND every child inside it.
                if (isManaged && (prop === 'display' || prop === 'visibility')) return;
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
        // Step 5c-canvas: Copy live canvas pixel data into clone canvases.
        // html2canvas clones <canvas> elements as blank — pixel content drawn
        // via JS (e.g. damage-bar face-crop icons) must be copied manually.
        // Also re-flushes any pending face-crop jobs from the image cache so
        // icons that hadn't loaded yet are painted before we copy.
        // =====================================================================
        if (typeof _dmgFaceDrawQueue !== 'undefined' && typeof _dmgImgCache !== 'undefined') {
            _dmgFaceDrawQueue.forEach(function(job) {
                var liveCanvas = document.getElementById(job.canvasId);
                var cachedImg  = _dmgImgCache[job.imgSrc];
                if (!liveCanvas || !cachedImg) return;
                var ctx = liveCanvas.getContext('2d');
                var iw = cachedImg.naturalWidth  || cachedImg.width;
                var ih = cachedImg.naturalHeight || cachedImg.height;
                var posStr   = (typeof getFacePosition === 'function') ? getFacePosition(job.imgSrc) : '50% 10%';
                var parts    = posStr.split(' ');
                var faceCX   = parseFloat(parts[0]) / 100;
                var faceCY   = parseFloat(parts[1]) / 100;
                var cropSide = Math.min(iw, ih * 0.65);
                var srcX = Math.max(0, Math.min(iw - cropSide, (iw * faceCX) - cropSide / 2));
                var srcY = Math.max(0, Math.min(ih - cropSide, (ih * faceCY) - cropSide / 2));
                ctx.clearRect(0, 0, job.size, job.size);
                ctx.save();
                ctx.beginPath();
                ctx.arc(job.size / 2, job.size / 2, job.size / 2, 0, Math.PI * 2);
                ctx.clip();
                ctx.drawImage(cachedImg, srcX, srcY, cropSide, cropSide, 0, 0, job.size, job.size);
                ctx.restore();
            });
        }
        var liveCanvases  = Array.from(target.querySelectorAll('canvas[id^="dmg-face-"]'));
        var cloneCanvases = Array.from(clone.querySelectorAll('canvas[id^="dmg-face-"]'));
        liveCanvases.forEach(function(liveC, idx) {
            var cloneC = cloneCanvases[idx];
            if (!cloneC) return;
            cloneC.width  = liveC.width;
            cloneC.height = liveC.height;
            try {
                var ctx = cloneC.getContext('2d');
                ctx.drawImage(liveC, 0, 0);
            } catch(e) {}
        });

        // ── Formation face canvases (form-face-N) ────────────────────────────
        // These are drawn via _drawFormationFace() in teamgrid.js using
        // _formImgCache. We must flush any pending draws onto the live canvases
        // first, then copy pixel data into the clone canvases.
        var _imgCacheRef = (typeof _formImgCache !== 'undefined' ? _formImgCache : {});
        // Also include dmgImgCache as a fallback (battlestats shares the same images)
        if (typeof _dmgImgCache !== 'undefined') {
            Object.keys(_dmgImgCache).forEach(function(k) {
                if (!_imgCacheRef[k]) _imgCacheRef[k] = _dmgImgCache[k];
            });
        }
        // Re-draw every live form-face canvas so export captures the latest state
        Array.from(target.querySelectorAll('canvas[id^="form-face-"]')).forEach(function(liveC) {
            // Derive the formation slot index from the canvas id (form-face-N)
            var formIdx = parseInt(liveC.id.replace('form-face-', ''), 10);
            if (isNaN(formIdx)) return;
            var teamSlotIdx = (typeof formationSlots !== 'undefined') ? formationSlots[formIdx] : -1;
            if (teamSlotIdx === -1) return;
            var charName = (typeof slotData !== 'undefined' && slotData[teamSlotIdx])
                ? slotData[teamSlotIdx].character : null;
            if (!charName) return;
            var charEntry = (typeof db !== 'undefined' && db.characters)
                ? db.characters.find(function(c) { return c.name === charName; }) : null;
            var imgSrc = (typeof getSlotCharImg === 'function')
                ? (getSlotCharImg(teamSlotIdx) || (charEntry && charEntry.img))
                : (charEntry && charEntry.img);
            if (!imgSrc) return;
            var cachedImg = _imgCacheRef[imgSrc];
            if (!cachedImg) return;
            var size = liveC.width;
            var ctx  = liveC.getContext('2d');
            var iw = cachedImg.naturalWidth  || cachedImg.width;
            var ih = cachedImg.naturalHeight || cachedImg.height;
            var posStr = (typeof getFacePosition === 'function') ? getFacePosition(imgSrc) : '50% 10%';
            var parts  = posStr.split(' ');
            var faceCX = parseFloat(parts[0]) / 100;
            var faceCY = parseFloat(parts[1]) / 100;
            var cropSide = Math.min(iw, ih * 0.65);
            var srcX = Math.max(0, Math.min(iw - cropSide, (iw * faceCX) - cropSide / 2));
            var srcY = Math.max(0, Math.min(ih - cropSide, (ih * faceCY) - cropSide / 2));
            ctx.clearRect(0, 0, size, size);
            ctx.save();
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(cachedImg, srcX, srcY, cropSide, cropSide, 0, 0, size, size);
            ctx.restore();
        });
        // Now copy all live form-face canvases into their clone counterparts
        var liveFormCanvases  = Array.from(target.querySelectorAll('canvas[id^="form-face-"]'));
        var cloneFormCanvases = Array.from(clone.querySelectorAll('canvas[id^="form-face-"]'));
        liveFormCanvases.forEach(function(liveC, idx) {
            var cloneC = cloneFormCanvases[idx];
            if (!cloneC) return;
            cloneC.width  = liveC.width;
            cloneC.height = liveC.height;
            try {
                var ctx = cloneC.getContext('2d');
                ctx.drawImage(liveC, 0, 0);
            } catch(e) {}
        });

        // =====================================================================
        // Step 5d: Hide empty content + fix background/border bleed
        // MUST run AFTER Step 5 -- the style-copy loop above would overwrite
        // any display:none or background changes made earlier.
        // =====================================================================

        function slotIsEmpty(i) { return !slotData[i] || !slotData[i].character; }

        // 1. Team-grid sections
        // Use the module-level colour maps from teamgrid.js directly.
        var _exportElPortraitBg  = EL_PORTRAIT_BG;
        var _exportElBorderSolid = EL_BORDER_SOLID;
        var _exportElBorderColor = EL_BORDER_COLOR;

        var cloneGridFinal = clone.querySelector('#team-grid');
        if (cloneGridFinal) {
            Array.from(cloneGridFinal.querySelectorAll('section')).forEach(function(sec, i) {
                if (slotIsEmpty(i)) {
                    // Use visibility:hidden instead of display:none so the CSS grid
                    // layout stays intact and filled cards don't shift position.
                    sec.style.visibility    = 'hidden';
                    sec.style.pointerEvents = 'none';
                    sec.style.opacity       = '0';
                    return;
                }

                // Read element for this slot
                var charInfo = slotData[i].character ? getCharInfo(slotData[i].character) : {};
                var el       = charInfo.element || '';

                // Outer card: solid background, no gradient (composites badly on transparent canvas)
                sec.style.background      = '#181a24';
                sec.style.backgroundColor = '#181a24';
                sec.style.backgroundImage = 'none';
                sec.style.borderColor     = _exportElBorderColor[el] || 'rgba(45,49,66,0.33)';
                sec.style.borderStyle     = 'solid';
                sec.style.borderWidth     = '1px';

                // Portrait container — apply correct element background directly,
                // remove box-shadow insets that cause visible overlay artifacts.
                var portraitBg = el ? (_exportElPortraitBg[el] || '#20222f') : '#20222f';
                var elSolid    = el ? (_exportElBorderSolid[el] || '#2d3142') : '#2d3142';
                Array.from(sec.querySelectorAll('.relative.rounded-lg.overflow-hidden')).forEach(function(pd, pdIdx) {
                    // Only target the character portrait (first one); skip card container
                    if (pdIdx > 0) return;
                    pd.style.background      = portraitBg;
                    pd.style.backgroundColor = portraitBg;
                    pd.style.backgroundImage = 'none';
                    // Remove inset box-shadows entirely — they render as solid-colour
                    // overlapping rectangles in html2canvas and darken/tint the portrait.
                    pd.style.boxShadow  = 'none';
                    pd.style.border     = '1px solid ' + elSolid + '88';
                });

                // Card display container — use #card-display-N id to avoid matching
                // gear squircles which share the .relative.bg-slotBg classes
                var cardDisplayEl = sec.querySelector('#card-display-' + i);
                var cardContainer = cardDisplayEl ? cardDisplayEl.parentElement : null;
                if (cardContainer) {
                    cardContainer.style.background      = '#20222f';
                    cardContainer.style.backgroundColor = '#20222f';
                    cardContainer.style.backgroundImage = 'none';
                    cardContainer.style.borderColor     = _exportElBorderColor[el] || '#2d3142';
                    cardContainer.style.borderStyle     = 'solid';
                    cardContainer.style.boxShadow       = 'none';
                }

                // Gear slot hide/show — explicit on every slot, no assumptions.
                // data-gear-cat targets the wrapper div precisely; visibility is
                // always set (not just toggled) so Step 5 style-copy can't bleed through.
                var gearCats = ['Weapon', 'Armor', 'Helmet', 'Rune'];
                var slot = slotData[i];
                var allGearEmpty = gearCats.every(function(cat) { return !slot.gear[cat]; });

                if (allGearEmpty) {
                    // Hide the entire 2×2 gear grid when nothing is equipped
                    var gearGrid = sec.querySelector('.grid.grid-cols-2');
                    if (gearGrid) {
                        gearGrid.style.visibility = 'hidden';
                        gearGrid.style.opacity    = '0';
                    }
                } else {
                    // Some gear equipped — ensure the grid itself is visible,
                    // then control each individual slot wrapper
                    var gearGrid = sec.querySelector('.grid.grid-cols-2');
                    if (gearGrid) {
                        gearGrid.style.visibility = 'visible';
                        gearGrid.style.opacity    = '1';
                    }
                    gearCats.forEach(function(cat) {
                        var wrapper = sec.querySelector('[data-gear-cat="' + cat + '"]');
                        if (!wrapper) return;
                        if (!slot.gear[cat]) {
                            // Empty slot — hide wrapper (squircle + stat badge together)
                            wrapper.style.visibility = 'hidden';
                            wrapper.style.opacity    = '0';
                        } else {
                            // Gear equipped — explicitly keep visible
                            wrapper.style.visibility = 'visible';
                            wrapper.style.opacity    = '1';
                            // Find the squircle and force it visible + correct bg/border
                            var squircle = wrapper.querySelector('.slot-squircle');
                            if (squircle) {
                                squircle.style.visibility = 'visible';
                                squircle.style.opacity    = '1';
                                var gearEntry = (typeof db !== 'undefined' && db[cat])
                                    ? db[cat].find(function(g) { return g.name === slot.gear[cat]; })
                                    : null;
                                if (gearEntry && gearEntry.unique) {
                                    squircle.style.background  = '#180f2a';
                                    squircle.style.borderColor = '#a855f7';
                                    squircle.style.borderStyle = 'solid';
                                    squircle.style.borderWidth = '1.5px';
                                    squircle.style.boxShadow   = 'none';
                                } else {
                                    squircle.style.background  = '#20222f';
                                    squircle.style.borderColor = '#334155';
                                    squircle.style.borderStyle = 'solid';
                                    squircle.style.borderWidth = '1px';
                                    squircle.style.boxShadow   = 'none';
                                }
                            }
                            // Stat badge: hide only if no priority stats saved
                            var sp = (slot.statPriority && slot.statPriority[cat]) || [];
                            var statBadge = wrapper.querySelector('[data-stat-badge]');
                            if (statBadge) {
                                if (sp.length === 0) {
                                    statBadge.style.visibility = 'hidden';
                                    statBadge.style.opacity    = '0';
                                } else {
                                    statBadge.style.visibility = 'visible';
                                    statBadge.style.opacity    = '1';
                                }
                            }
                        }
                    });
                }

                // Card slot — explicitly show or hide based on slot.card
                if (cardContainer) {
                    if (!slot.card) {
                        cardContainer.style.visibility = 'hidden';
                        cardContainer.style.opacity    = '0';
                    } else {
                        cardContainer.style.visibility = 'visible';
                        cardContainer.style.opacity    = '1';
                    }
                }
            });
        }

        // 2. Side panel — show only whichever sub-panel is currently active in the live UI.
        // Step 5 is prevented from touching their display/visibility via _managedLiveSet.
        var clonePanelFinal = clone.querySelector('#team-stats-wrapper > div:last-child');
        var cloneNotesPanel = clonePanelFinal ? clonePanelFinal.querySelector('#comments-panel')     : null;
        var cloneDmgPanel   = clonePanelFinal ? clonePanelFinal.querySelector('#battle-stats-panel') : null;

        // Determine which panel is active in the live DOM right now.
        var _liveDmgPanel   = document.getElementById('battle-stats-panel');
        var _liveNotesPanel = document.getElementById('comments-panel');
        var _dmgIsActive    = _liveDmgPanel   && _liveDmgPanel.style.display   === 'flex';
        var _notesIsActive  = _liveNotesPanel && _liveNotesPanel.classList.contains('visible');
        // Fallback: if neither clearly active, default to notes
        if (!_dmgIsActive && !_notesIsActive) _notesIsActive = true;

        if (clonePanelFinal) {
            // Force the column itself visible
            clonePanelFinal.style.display    = 'flex';
            clonePanelFinal.style.visibility = 'visible';
            clonePanelFinal.style.opacity    = '1';

            // Show notes panel only if it is the active panel
            if (cloneNotesPanel) {
                if (_notesIsActive) {
                    cloneNotesPanel.style.display    = 'flex';
                    cloneNotesPanel.style.visibility = 'visible';
                    cloneNotesPanel.style.opacity    = '1';
                    cloneNotesPanel.querySelectorAll('*').forEach(function(el) {
                        el.style.visibility = 'visible';
                        el.style.opacity    = '1';
                        if (el.style.display === 'none') el.style.display = '';
                    });
                } else {
                    cloneNotesPanel.style.display    = 'none';
                    cloneNotesPanel.style.visibility = 'hidden';
                }
            }

            // Show damage panel only if it is the active panel
            if (cloneDmgPanel) {
                if (_dmgIsActive) {
                    cloneDmgPanel.style.display    = 'flex';
                    cloneDmgPanel.style.visibility = 'visible';
                    cloneDmgPanel.style.opacity    = '1';
                    cloneDmgPanel.querySelectorAll('*').forEach(function(el) {
                        el.style.visibility = 'visible';
                        el.style.opacity    = '1';
                        if (el.style.display === 'none') el.style.display = '';
                    });
                } else {
                    cloneDmgPanel.style.display    = 'none';
                    cloneDmgPanel.style.visibility = 'hidden';
                }
            }
        }

        // 3. Empty pet columns
        for (var pi = 0; pi < 3; pi++) {
            if (petsData[pi] && petsData[pi].name) {
                // Pet is filled — hide only individual empty gem cells
                var gems = (petsData[pi].gems) || [null, null, null, null];
                var petNum = pi + 1; // gem IDs use p1/p2/p3
                var allGemsEmpty = true;
                for (var gi = 0; gi < 4; gi++) {
                    var gemCellEl = clone.querySelector('#gem-p' + petNum + '-' + gi);
                    if (!gemCellEl) continue;
                    var gemCellParent = gemCellEl.parentElement; // the cell div
                    if (!gems[gi]) {
                        // visibility:hidden preserves grid cell size — display:none
                        // would collapse the cell and reflow the other gems.
                        if (gemCellParent) {
                            gemCellParent.style.visibility = 'hidden';
                            gemCellParent.style.opacity    = '0';
                        }
                    } else {
                        allGemsEmpty = false;
                    }
                }
                // If all gems empty, hide the whole gem grid container too
                if (allGemsEmpty) {
                    var firstGemCell = clone.querySelector('#gem-p' + petNum + '-0');
                    if (firstGemCell) {
                        var gemGrid = firstGemCell.parentElement && firstGemCell.parentElement.parentElement;
                        if (gemGrid) {
                            gemGrid.style.visibility = 'hidden';
                            gemGrid.style.opacity    = '0';
                        }
                    }
                    // Also hide the gem-stat badge
                    var gemBadge = clone.querySelector('#gem-stat-badge-' + pi);
                    if (gemBadge) {
                        gemBadge.style.visibility = 'hidden';
                        gemBadge.style.opacity    = '0';
                    }
                } else {
                    // Gems present but no stat preset chosen — hide the stat badge
                    var gemStat = petsData[pi].gemStat;
                    if (!gemStat || gemStat.length === 0) {
                        var gemStatBadge = clone.querySelector('#gem-stat-badge-' + pi);
                        if (gemStatBadge) {
                            gemStatBadge.style.visibility = 'hidden';
                            gemStatBadge.style.opacity    = '0';
                        }
                    }
                }
                continue;
            }
            // Pet slot empty — hide column but keep its space so layout doesn't reflow
            var petSlotEl = clone.querySelector('[data-pet-idx="' + pi + '"]');
            if (!petSlotEl) continue;
            var petCol = petSlotEl.closest('.flex.flex-col.gap-2');
            if (petCol) {
                petCol.style.visibility = 'hidden';
                petCol.style.opacity    = '0';
            }
        }

        // 4. Formation section -- hide if entirely empty
        var allFormEmpty = formationSlots.every(function(v) { return v === -1 || slotIsEmpty(v); });
        if (allFormEmpty) {
            var fs0 = clone.querySelector('#form-slot-0');
            if (fs0) {
                var formRows = fs0.closest('.flex.flex-col.gap-1');
                if (formRows && formRows.parentElement) {
                    formRows.parentElement.style.display    = 'none';
                    formRows.parentElement.style.visibility = 'hidden';
                }
            }
        }

        // 5. Ultimate rotation -- hide section or individual empty slots
        var hasAnyRot    = ultimateRotation.some(function(s) { return s.character; });
        var cloneUltCont = clone.querySelector('#ultimate-rotation-container');
        if (!hasAnyRot) {
            if (cloneUltCont) {
                var ultSec = cloneUltCont.closest('.border-t');
                if (ultSec) { ultSec.style.display = 'none'; ultSec.style.visibility = 'hidden'; }
            }
        } else if (cloneUltCont) {
            Array.from(cloneUltCont.querySelectorAll('.ult-rotation-slot')).forEach(function(slot) {
                var idx = parseInt(slot.dataset.ultIdx);
                if (!isNaN(idx) && ultimateRotation[idx] && ultimateRotation[idx].character) return;
                // visibility:hidden keeps the flex row layout intact — display:none
                // would collapse the slot and shift the arrows/remaining slots.
                slot.style.visibility = 'hidden';
                slot.style.opacity    = '0';
                var next = slot.nextElementSibling;
                if (next && next.classList.contains('ult-arrow')) {
                    next.style.visibility = 'hidden';
                    next.style.opacity    = '0';
                }
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
