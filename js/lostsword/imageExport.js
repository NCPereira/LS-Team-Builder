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
        //    The battle-stats/comments column uses flex:1 with min/max-width, but
        //    in the off-screen clone it loses its flex parent context and can shrink.
        //    Grab the live rendered width and pin it explicitly so the column stays
        //    the same size it is on screen.
        const livePanelCol = target.querySelector('#team-stats-wrapper > div:last-child');
        const clonePanelCol = clone.querySelector('#team-stats-wrapper > div:last-child');
        if (livePanelCol && clonePanelCol) {
            const colRect = livePanelCol.getBoundingClientRect();
            const colW    = Math.round(colRect.width);
            const colH    = Math.round(colRect.height);
            clonePanelCol.style.width    = `${colW}px`;
            clonePanelCol.style.minWidth = `${colW}px`;
            clonePanelCol.style.maxWidth = `${colW}px`;
            clonePanelCol.style.height   = `${colH}px`;
            clonePanelCol.style.flexShrink = '0';
            clonePanelCol.style.flexGrow   = '0';
        }

        // ── Step 2c: Freeze ult-time-wrapper visibility state ────────────────
        //    .ult-time-wrapper uses max-height/opacity CSS transitions for its
        //    show/hide toggle. The transition property itself can cause html2canvas
        //    to catch the element mid-animation, and copying computed styles alone
        //    isn't reliable for transition-driven visibility. We freeze each wrapper
        //    explicitly: if .visible → fully open; otherwise → fully closed.
        //    Also kill all transitions in the clone so nothing can animate during render.
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

        // ── Step 3: Replace textareas AND text inputs with divs ──────────────
        //    html2canvas cannot read .value on form controls, so we replace them
        //    with styled divs showing the live value as textContent.
        //    Covers: notes textarea + ult-rotation time inputs.
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

        // Text inputs (ult-time-input etc.) — skip checkbox/radio/file
        const liveInputs = Array.from(target.querySelectorAll('input[type="text"], input:not([type])'));
        Array.from(clone.querySelectorAll('input[type="text"], input:not([type])')).forEach((cloneIn, idx) => {
            replaceFormControlWithDiv(cloneIn, liveInputs[idx] || null);
        });

        // ── Step 4: Replace FA icons with zero-size placeholders ─────────────
        //    display:none collapses the flex gap inside panel-toggle buttons,
        //    shifting the label text. A zero-size invisible span preserves layout.
        clone.querySelectorAll('i[class*="fa-"]').forEach(i => {
            const span = document.createElement('span');
            span.style.cssText = 'display:inline-block;width:0;height:0;overflow:hidden;visibility:hidden;flex-shrink:0;';
            i.parentNode.replaceChild(span, i);
        });

        // ── Step 5: Copy ALL computed styles from every live element to clone ─
        //    Walk both trees in parallel (cloneNode preserves DOM order).
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
            // Kill all transitions — nothing should animate during the off-screen render
            try { cloneEl.style.transition = 'none'; } catch(_) {}
        });

        // ── Step 5c: Force clone root to transparent background ───────────────
        //    #capture-area has class="bg-[#0f111a]" which Step 5 copies as a
        //    computed backgroundColor onto the clone. Clear it explicitly so the
        //    exported PNG has no background fill.
        clone.style.background      = 'transparent';
        clone.style.backgroundColor = 'transparent';

        // ── Step 5b: Replace <img> elements with background-image divs ──────────
        //    html2canvas fails to render object-fit:cover and transform:scale on imgs.
        //    We replace every qualifying img with a background-image div instead.
        liveAll.forEach((liveEl, i) => {
            if (liveEl.tagName !== 'IMG') return;
            const cloneEl = cloneAll[i];
            if (!cloneEl) return;

            const cs        = window.getComputedStyle(liveEl);
            const transform = cs.transform || cs.webkitTransform || '';
            const objFit    = cs.objectFit || '';
            // Grab object-position from inline style first, then computed
            const objPos    = liveEl.style.objectPosition || cs.objectPosition || '';

            const isScaled  = transform && transform !== 'none' && transform !== 'matrix(1, 0, 0, 1, 0, 0)';
            const hasObjFit = objFit === 'cover' || objFit === 'contain';
            if (!isScaled && !hasObjFit) return;

            const src = liveEl.src || liveEl.getAttribute('src') || '';
            if (!src) return;

            // ── background-size ────────────────────────────────────────────────
            // For scaled imgs bake the scale factor in; otherwise mirror object-fit.
            let bgSize;
            if (isScaled && !hasObjFit) {
                let scale = 1;
                const matMatch = transform.match(/matrix\(([^,]+)/);
                if (matMatch) scale = parseFloat(matMatch[1]) || 1;
                bgSize = `${Math.round(scale * 100)}%`;
            } else if (objFit === 'cover') {
                bgSize = 'cover';
            } else {
                bgSize = 'contain';
            }

            // ── background-position ────────────────────────────────────────────
            // Prefer object-position (face-crop coords); fall back to transform-origin.
            let bgPosX = '50%';
            let bgPosY = '10%';   // sensible default for portrait character art

            if (isScaled) {
                const originRaw   = cs.transformOrigin || '50% 50%';
                const originParts = originRaw.split(' ');
                bgPosX = originParts[0] || '50%';
                bgPosY = originParts[1] || '50%';
                if (bgPosX === 'center') bgPosX = '50%';
                if (bgPosY === 'center') bgPosY = '50%';
            }

            if (objPos && objPos !== 'auto' && objPos !== '50% 50%') {
                const pp = objPos.trim().split(/\s+/);
                if (pp[0]) bgPosX = pp[0];
                if (pp[1]) bgPosY = pp[1];
            }

            // ── Build replacement div ──────────────────────────────────────────
            // Detect if this image is an absolute-fill child (position:absolute, inset:0)
            // — character portraits and card images now use this pattern after the
            // teamgrid fix. For these we must replicate position:absolute;inset:0
            // exactly so the div fills its parent without any gaps.
            const liveParent   = liveEl.parentElement;
            const parentCs     = liveParent ? window.getComputedStyle(liveParent) : null;
            const imgIsAbsFill = cs.position === 'absolute' ||
                                 (cs.width === (parentCs && parentCs.width) &&
                                  cs.height === (parentCs && parentCs.height) &&
                                  parseFloat(cs.width) > 0);

            const div = document.createElement('div');
            div.style.backgroundImage    = `url("${src}")`;
            div.style.backgroundSize     = bgSize;
            div.style.backgroundPosition = `${bgPosX} ${bgPosY}`;
            div.style.backgroundRepeat   = 'no-repeat';
            div.style.overflow           = 'hidden';
            div.style.transform          = 'none';
            div.style.borderRadius       = cs.borderRadius;

            if (imgIsAbsFill) {
                // Fill parent completely — no gaps, no lines
                div.style.position = 'absolute';
                div.style.inset    = '0';
                div.style.width    = '100%';
                div.style.height   = '100%';
                div.style.display  = 'block';
            } else {
                // Non-fill image (icons, gear, pets) — keep exact dimensions
                div.style.display    = cs.display === 'inline' ? 'inline-block' : (cs.display || 'block');
                div.style.width      = cs.width;
                div.style.height     = cs.height;
                div.style.minWidth   = cs.minWidth;
                div.style.minHeight  = cs.minHeight;
                div.style.flexShrink = cs.flexShrink;
                div.style.flexGrow   = cs.flexGrow;
                div.style.flexBasis  = cs.flexBasis;
            }

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

        // The clone itself must also be sized explicitly
        clone.style.cssText += `; width:${W}px; max-width:${W}px; height:auto;`;

        offscreen.appendChild(clone);
        document.body.appendChild(offscreen);

        // Give browser one frame to paint the off-screen clone
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
                // Fix img display in html2canvas's internal clone too
                const s = doc.createElement('style');
                s.textContent = 'img { display: inline-block !important; }';
                doc.head.appendChild(s);
                // Force capture-area background transparent
                const ca = doc.getElementById('capture-area');
                if (ca) { ca.style.background = 'transparent'; ca.style.backgroundColor = 'transparent'; }
                // Replace FA icons with zero-size spans to preserve flex layout
                doc.querySelectorAll('i[class*="fa-"]').forEach(i => {
                    const span = doc.createElement('span');
                    span.style.cssText = 'display:inline-block;width:0;height:0;overflow:hidden;visibility:hidden;flex-shrink:0;';
                    i.parentNode.replaceChild(span, i);
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
