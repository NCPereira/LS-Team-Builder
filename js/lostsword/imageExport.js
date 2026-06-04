// ── imageExport.js ────────────────────────────────────────────────────────────
// PNG export via html2canvas.
// Captures #capture-area at its absolute document position — scroll-independent.
// onclone fixes vertical text/flex drift caused by html2canvas's iframe not
// fully inheriting Tailwind's computed styles in time.

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
                // ── 1. Hide FontAwesome icons (render as boxes) ──────────────
                doc.querySelectorAll('i[class*="fa-"]').forEach(i => {
                    i.style.display = 'none';
                });

                // ── 2. Copy every element's live computed styles into inline
                //       styles on the clone. This is the most reliable fix for
                //       html2canvas not fully inheriting Tailwind/FA styles.
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
    }
}
