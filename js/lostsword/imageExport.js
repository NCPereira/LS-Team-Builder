// ── imageExport.js ────────────────────────────────────────────────────────────
// PNG export via html2canvas.
// Always captures from the team title header down to the bottom of the
// Ultimate Rotation section — completely independent of scroll position.

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
        // ── Get the element's absolute position in the document ─────────────
        // offsetTop/offsetLeft walk up the offset parent chain — no viewport,
        // no scroll position involved at all.
        function getDocOffset(el) {
            let top = 0, left = 0;
            while (el) {
                top  += el.offsetTop  || 0;
                left += el.offsetLeft || 0;
                el    = el.offsetParent;
            }
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
            // Absolute document coordinates — scroll position irrelevant
            x:            elLeft,
            y:            elTop,
            width:        elW,
            height:       elH,
            // Must match true document size so html2canvas lays out correctly
            windowWidth:  docW,
            windowHeight: docH,
            // Tell html2canvas the page is at scroll 0 for its internal math
            scrollX:      0,
            scrollY:      0,
            onclone: (doc) => {
                doc.querySelectorAll('i[class*="fa-"]').forEach(i => {
                    i.style.display = 'none';
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
