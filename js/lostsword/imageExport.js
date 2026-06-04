// ── imageExport.js ────────────────────────────────────────────────────────────
// PNG export via html2canvas.
// Captures #capture-area at its absolute document position — scroll-independent.
// onclone fixes:
//   1. Vertical text/flex drift from Tailwind preflight setting img{display:block}
//   2. textarea (comments panel) not rendered — replaced with a styled div
//   3. Inactive panel hidden so only the visible one exports

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

    // ── Fix #1 (text shift): inject inline-block rule for html2canvas's
    //    internal measurement div BEFORE the call, remove it after.
    //    html2canvas appends a div to body to measure text; Tailwind preflight's
    //    img{display:block} leaks into that div and shifts baselines.
    const h2cStyleFix = document.createElement('style');
    h2cStyleFix.textContent = 'body > div:last-child img { display: inline-block !important; }';
    document.head.appendChild(h2cStyleFix);

    try {
        // ── Absolute document position (scroll-independent) ─────────────────
        function getDocOffset(el) {
            let top = 0, left = 0;
            while (el) { top += el.offsetTop || 0; left += el.offsetLeft || 0; el = el.offsetParent; }
            return { top, left };
        }
        const { top: elTop, left: elLeft } = getDocOffset(target);
        const elW = target.offsetWidth;
        const elH = target.offsetHeight;
        const docW = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
        const docH = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);

        const canvas = await html2canvas(document.body, {
            useCORS:         true,
            allowTaint:      false,
            backgroundColor: '#0f111a',
            scale:           2,
            logging:         false,
            imageTimeout:    0,
            x:            elLeft,
            y:            elTop,
            width:        elW,
            height:       elH,
            windowWidth:  docW,
            windowHeight: docH,
            scrollX:      0,
            scrollY:      0,

            onclone: (doc) => {
                // ── 1. Hide FontAwesome icons (render as boxes without the font) ──
                doc.querySelectorAll('i[class*="fa-"]').forEach(i => {
                    i.style.display = 'none';
                });

                // ── 2. Fix img display:inline-block inside the cloned document ──
                //    Mirrors the runtime style fix above but inside the clone tree.
                const imgFixStyle = doc.createElement('style');
                imgFixStyle.textContent = 'img { display: inline-block !important; }';
                doc.head.appendChild(imgFixStyle);

                // ── 3. Fix textarea (comments panel) ────────────────────────────
                //    html2canvas cannot read textarea .value — replace every
                //    textarea in the capture area with a <div> that has the same
                //    computed styles and contains the live text as a text node.
                const cloneCaptureArea = doc.getElementById('capture-area');
                if (cloneCaptureArea) {
                    cloneCaptureArea.querySelectorAll('textarea').forEach((cloneTa, idx) => {
                        // Get the matching live textarea to read its current value
                        const liveTas = target.querySelectorAll('textarea');
                        const liveTa  = liveTas[idx];
                        const value   = liveTa ? liveTa.value : '';

                        const div = doc.createElement('div');
                        // Copy all computed styles from the live textarea
                        if (liveTa) {
                            const cs = window.getComputedStyle(liveTa);
                            const TEXTAREA_PROPS = [
                                'display', 'width', 'height', 'minHeight', 'maxHeight',
                                'padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
                                'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
                                'fontSize', 'fontWeight', 'fontFamily', 'lineHeight', 'letterSpacing',
                                'color', 'backgroundColor', 'background',
                                'border', 'borderColor', 'borderWidth', 'borderStyle', 'borderRadius',
                                'boxSizing', 'whiteSpace', 'wordBreak', 'overflowWrap',
                                'textAlign', 'verticalAlign', 'resize',
                            ];
                            TEXTAREA_PROPS.forEach(prop => {
                                try { div.style[prop] = cs[prop]; } catch(_) {}
                            });
                        }
                        // Ensure the replacement div renders cleanly
                        div.style.overflow   = 'hidden';
                        div.style.whiteSpace = 'pre-wrap';
                        div.style.resize     = 'none';

                        // Show placeholder text styled dimly if empty
                        if (value.trim() === '') {
                            div.textContent      = cloneTa.getAttribute('placeholder') || '';
                            div.style.color      = '#475569';
                            div.style.fontStyle  = 'italic';
                        } else {
                            div.textContent = value;
                        }

                        cloneTa.parentNode.replaceChild(div, cloneTa);
                    });

                    // ── 4. Hide whichever panel is currently inactive ────────────
                    //    The live DOM may have one of the two panels hidden via
                    //    display:none / missing .visible class. Mirror that in clone.
                    const liveDmgPanel    = document.getElementById('battle-stats-panel');
                    const liveNotesPanel  = document.getElementById('comments-panel');
                    const cloneDmgPanel   = doc.getElementById('battle-stats-panel');
                    const cloneNotesPanel = doc.getElementById('comments-panel');

                    if (liveDmgPanel && cloneDmgPanel) {
                        cloneDmgPanel.style.display =
                            window.getComputedStyle(liveDmgPanel).display;
                    }
                    if (liveNotesPanel && cloneNotesPanel) {
                        // comments-panel uses display:flex when .visible is present
                        const notesVisible = liveNotesPanel.classList.contains('visible');
                        cloneNotesPanel.style.display = notesVisible ? 'flex' : 'none';
                    }
                }

                // ── 5. Copy every element's live computed styles into inline styles ──
                //    Most reliable guard against Tailwind/FA style drift in the clone.
                const liveEls  = target.querySelectorAll('*');
                const cloneEls = doc.getElementById('capture-area').querySelectorAll('*');

                const PROPS = [
                    'display', 'flexDirection', 'alignItems', 'justifyContent',
                    'alignSelf', 'justifySelf', 'flexWrap', 'gap', 'rowGap', 'columnGap',
                    'padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
                    'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
                    'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
                    'boxSizing', 'position', 'top', 'left', 'right', 'bottom',
                    'fontSize', 'fontWeight', 'fontFamily', 'lineHeight', 'letterSpacing',
                    'textAlign', 'verticalAlign', 'color', 'opacity',
                    'borderRadius', 'overflow', 'objectFit', 'objectPosition',
                    'background', 'backgroundColor', 'backgroundImage',
                    'border', 'borderColor', 'borderWidth', 'borderStyle',
                    'transform', 'transformOrigin',
                    'whiteSpace', 'wordBreak', 'overflowWrap',
                ];

                liveEls.forEach((liveEl, i) => {
                    const cloneEl = cloneEls[i];
                    if (!cloneEl) return;
                    // Skip textareas — already replaced with divs above
                    if (liveEl.tagName === 'TEXTAREA') return;
                    const cs = window.getComputedStyle(liveEl);
                    PROPS.forEach(prop => {
                        try { cloneEl.style[prop] = cs[prop]; } catch(_) {}
                    });
                });
            }
        });

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
        // Always remove the temporary text-shift fix style tag
        h2cStyleFix.remove();
    }
}
