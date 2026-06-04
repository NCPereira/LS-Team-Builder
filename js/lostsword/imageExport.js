// ── imageExport.js ────────────────────────────────────────────────────────────
// PNG export via html2canvas — captures #capture-area in-place.
// Depends on: html2canvas (loaded in index.html)

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

    // ── Stash & hide elements we don't want in the export ──────────────────
    const footer   = document.getElementById('page-footer');
    const dmgHist  = document.getElementById('dmg-timeline-section');
    const icons    = target.querySelectorAll('i[class*="fa-"]');

    const prevFooter  = footer  ? footer.style.display  : null;
    const prevDmgHist = dmgHist ? dmgHist.style.display : null;

    if (footer)  footer.style.visibility  = 'hidden';
    if (dmgHist) dmgHist.style.visibility = 'hidden';
    icons.forEach(i => { i._exp = i.style.display; i.style.display = 'none'; });

    // Let the DOM settle
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    try {
        // ── Measure the live element ────────────────────────────────────────
        const rect    = target.getBoundingClientRect();
        const scrollX = window.scrollX || window.pageXOffset || 0;
        const scrollY = window.scrollY || window.pageYOffset || 0;

        const docW = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
        const docH = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);

        // ── Render ──────────────────────────────────────────────────────────
        const canvas = await html2canvas(document.body, {
            useCORS:         true,
            allowTaint:      false,
            backgroundColor: '#0f111a',
            scale:           2,
            logging:         false,
            imageTimeout:    0,
            // Crop to exactly #capture-area
            x:               rect.left + scrollX,
            y:               rect.top  + scrollY,
            width:           rect.width,
            height:          rect.height,
            // Tell html2canvas the true document dimensions so it doesn't reflow
            windowWidth:     docW,
            windowHeight:    docH,
            scrollX:         0,
            scrollY:         0,
        });

        // ── Restore hidden elements ─────────────────────────────────────────
        if (footer)  footer.style.visibility  = '';
        if (dmgHist) dmgHist.style.visibility = '';
        icons.forEach(i => { i.style.display = i._exp || ''; });

        // ── Download ────────────────────────────────────────────────────────
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
        // Always restore on error
        if (footer)  footer.style.visibility  = '';
        if (dmgHist) dmgHist.style.visibility = '';
        icons.forEach(i => { i.style.display = i._exp || ''; });
        alert('Export failed: ' + err.message);
        btn.innerHTML = origHTML;
        btn.disabled  = false;
    }
}
