// ── imageExport.js ────────────────────────────────────────────────────────────
// PNG export via html2canvas — captures #capture-area.
// Scrolls to top before capture so scroll position never affects the output.

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

    // Stash scroll position and snap to top so html2canvas sees the page unscrolled
    const savedScrollX = window.scrollX || window.pageXOffset || 0;
    const savedScrollY = window.scrollY || window.pageYOffset || 0;
    window.scrollTo(0, 0);

    // Wait two frames for the browser to repaint at scroll 0
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    try {
        const canvas = await html2canvas(target, {
            useCORS:         true,
            allowTaint:      false,
            backgroundColor: '#0f111a',
            scale:           2,
            logging:         false,
            imageTimeout:    0,
            onclone: (doc) => {
                doc.querySelectorAll('i[class*="fa-"]').forEach(i => {
                    i.style.display = 'none';
                });
            }
        });

        // Restore scroll position
        window.scrollTo(savedScrollX, savedScrollY);

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
        window.scrollTo(savedScrollX, savedScrollY);
        alert('Export failed: ' + err.message);
        btn.innerHTML = origHTML;
        btn.disabled  = false;
    }
}
