// ── imageExport.js ────────────────────────────────────────────────────────────
// PNG export via html2canvas.
// Captures #capture-area directly (not document.body with crop offsets —
// that approach breaks complex flex layouts).

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

    // ── Fix: text-shift caused by Tailwind preflight img{display:block} ──────
    // html2canvas appends a hidden div to body to measure text metrics.
    // Without this, that div inherits Tailwind's img reset and shifts baselines.
    const h2cStyleFix = document.createElement('style');
    h2cStyleFix.textContent = [
        'body > div:last-child img { display: inline-block !important; }',
        'body > div:last-child * { line-height: normal !important; }',
    ].join('\n');
    document.head.appendChild(h2cStyleFix);

    try {
        const canvas = await html2canvas(target, {
            useCORS:         true,
            allowTaint:      false,
            backgroundColor: '#0f111a',
            scale:           2,
            logging:         false,
            imageTimeout:    0,
            // No x/y/width/height — capture the element directly
            // scrollX/scrollY still needed to handle page scroll
            scrollX: -window.scrollX,
            scrollY: -window.scrollY,

            onclone: (doc, cloneTarget) => {
                // ── 1. Hide FontAwesome icons (no font loaded in clone) ──────
                doc.querySelectorAll('i[class*="fa-"]').forEach(i => {
                    i.style.display = 'none';
                });

                // ── 2. Fix img display inside the cloned doc ─────────────────
                const imgStyle = doc.createElement('style');
                imgStyle.textContent = 'img { display: inline-block !important; }';
                doc.head.appendChild(imgStyle);

                // ── 3. Panel visibility — mirror live DOM ────────────────────
                //    Ensure only the currently active panel shows.
                const liveDmgPanel   = document.getElementById('battle-stats-panel');
                const liveNotesPanel = document.getElementById('comments-panel');
                const cloneDmgPanel  = doc.getElementById('battle-stats-panel');
                const cloneNotesPanel = doc.getElementById('comments-panel');

                if (liveDmgPanel && cloneDmgPanel) {
                    cloneDmgPanel.style.display =
                        window.getComputedStyle(liveDmgPanel).display;
                }
                if (liveNotesPanel && cloneNotesPanel) {
                    const notesVisible = liveNotesPanel.classList.contains('visible');
                    cloneNotesPanel.style.display = notesVisible ? 'flex' : 'none';
                }

                // ── 4. Replace textarea with a rendered div ──────────────────
                //    html2canvas cannot read textarea.value — only the DOM
                //    attribute. We swap each textarea for a styled <div>.
                cloneTarget.querySelectorAll('textarea').forEach((cloneTa, idx) => {
                    const liveTa = target.querySelectorAll('textarea')[idx];
                    const value  = liveTa ? liveTa.value : '';
                    const cs     = liveTa ? window.getComputedStyle(liveTa) : null;

                    const div = doc.createElement('div');

                    if (cs) {
                        [
                            'width', 'height', 'minHeight', 'maxHeight', 'boxSizing',
                            'padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
                            'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
                            'fontSize', 'fontWeight', 'fontFamily', 'lineHeight', 'letterSpacing',
                            'color', 'backgroundColor', 'background',
                            'border', 'borderColor', 'borderWidth', 'borderStyle', 'borderRadius',
                            'whiteSpace', 'wordBreak', 'overflowWrap', 'textAlign',
                        ].forEach(p => { try { div.style[p] = cs[p]; } catch(_) {} });
                    }

                    div.style.display    = 'block';
                    div.style.overflow   = 'hidden';
                    div.style.whiteSpace = 'pre-wrap';
                    div.style.resize     = 'none';

                    if (value.trim() === '') {
                        div.textContent     = cloneTa.getAttribute('placeholder') || '';
                        div.style.color     = '#475569';
                        div.style.fontStyle = 'italic';
                    } else {
                        div.textContent = value;
                    }

                    cloneTa.parentNode.replaceChild(div, cloneTa);
                });

                // ── 5. Copy computed styles from every live element to clone ──
                //    Prevents Tailwind/flex drift in the html2canvas iframe.
                const liveEls  = target.querySelectorAll('*');
                const cloneEls = cloneTarget.querySelectorAll('*');

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
                    if (!cloneEl || liveEl.tagName === 'TEXTAREA') return;
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
        h2cStyleFix.remove();
    }
}
