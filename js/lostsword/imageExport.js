// ── imageExport.js ────────────────────────────────────────────────────────────
// PNG export via html2canvas — captures #capture-area directly.
// Region: team title → bottom of Ultimate Rotation (excludes footer & graph).

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

    // Hide FontAwesome icons inside capture area (render as boxes in html2canvas)
    const icons = target.querySelectorAll('i[class*="fa-"]');
    icons.forEach(i => { i._exp = i.style.display; i.style.display = 'none'; });

    // Wait for DOM to settle after hiding icons
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    try {
        const canvas = await html2canvas(target, {
            useCORS:         true,
            allowTaint:      false,
            backgroundColor: '#0f111a',
            scale:           2,
            logging:         false,
            imageTimeout:    0,
            // No x/y/width/height — let html2canvas measure the element itself
            onclone: (doc) => {
                // In the cloned document, hide FA icons
                doc.querySelectorAll('i[class*="fa-"]').forEach(i => {
                    i.style.display = 'none';
                });
            }
        });

        // Restore icons
        icons.forEach(i => { i.style.display = i._exp || ''; });

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
        icons.forEach(i => { i.style.display = i._exp || ''; });
        alert('Export failed: ' + err.message);
        btn.innerHTML = origHTML;
        btn.disabled  = false;
    }
}
