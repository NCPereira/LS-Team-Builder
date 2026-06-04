// ── imageExport.js ────────────────────────────────────────────────────────────
// PNG export via html2canvas.
// Depends on: html2canvas (loaded in index.html)
//
// Fix notes (v2):
//  - Renders the LIVE elements in-place instead of cloning to an off-screen div.
//    Cloning caused image squish because the off-screen container had a different
//    computed width, making html2canvas stretch/shrink images to fill it.
//  - Passes explicit x/y/width/height from getBoundingClientRect() + scrollY so
//    html2canvas captures exactly the right region without position drift.
//  - Adds windowWidth/windowHeight equal to the real document width so
//    html2canvas doesn't reflow the page to a smaller viewport.

async function exportCapturePNG() {
    const btn = document.getElementById('export-png-btn');

    const teamWrapper = document.getElementById('team-stats-wrapper');
    const petsSection = teamWrapper ? teamWrapper.nextElementSibling : null;

    if (!teamWrapper || typeof html2canvas === 'undefined') {
        alert('html2canvas not loaded yet — try again in a moment.');
        return;
    }

    const origHTML = btn.innerHTML;
    btn.innerHTML  = 'Rendering…';
    btn.disabled   = true;

    try {
        // ── 1. Collect the live elements we want in the export ──────────────
        const targets = [teamWrapper];
        if (petsSection && petsSection.tagName === 'SECTION') {
            targets.push(petsSection);
        }

        // ── 2. Measure the combined bounding rect in document coordinates ───
        //    getBoundingClientRect() is viewport-relative, so add scrollY/scrollX.
        const scrollX = window.scrollX || window.pageXOffset || 0;
        const scrollY = window.scrollY || window.pageYOffset || 0;

        let minLeft   = Infinity, minTop = Infinity;
        let maxRight  = -Infinity, maxBottom = -Infinity;

        targets.forEach(el => {
            const r = el.getBoundingClientRect();
            minLeft   = Math.min(minLeft,   r.left   + scrollX);
            minTop    = Math.min(minTop,    r.top    + scrollY);
            maxRight  = Math.max(maxRight,  r.right  + scrollX);
            maxBottom = Math.max(maxBottom, r.bottom + scrollY);
        });

        const GAP = 20; // padding around the capture region
        const captureX      = Math.max(0, minLeft - GAP);
        const captureY      = Math.max(0, minTop  - GAP);
        const captureWidth  = maxRight  - minLeft + GAP * 2;
        const captureHeight = maxBottom - minTop  + GAP * 2;

        // ── 3. Temporarily hide FA icons (they render as boxes in html2canvas) ─
        const icons = document.querySelectorAll('i[class*="fa-"]');
        icons.forEach(i => { i._origDisplay = i.style.display; i.style.display = 'none'; });

        // Give the DOM one frame to settle after hiding icons
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

        // ── 4. Capture ──────────────────────────────────────────────────────
        const docWidth = Math.max(
            document.documentElement.scrollWidth,
            document.body.scrollWidth
        );
        const docHeight = Math.max(
            document.documentElement.scrollHeight,
            document.body.scrollHeight
        );

        const canvas = await html2canvas(document.body, {
            useCORS:         true,
            allowTaint:      false,
            backgroundColor: '#0f111a',
            scale:           2,
            logging:         false,
            imageTimeout:    0,
            x:               captureX,
            y:               captureY,
            width:           captureWidth,
            height:          captureHeight,
            windowWidth:     docWidth,
            windowHeight:    docHeight,
            scrollX:         -scrollX,
            scrollY:         -scrollY,
        });

        // ── 5. Restore hidden icons ─────────────────────────────────────────
        icons.forEach(i => { i.style.display = i._origDisplay || ''; });

        // ── 6. Download ─────────────────────────────────────────────────────
        const dataUrl = canvas.toDataURL('image/png');
        const title   = (document.querySelector('h1[contenteditable]')?.innerText?.trim() || 'LSTB_Team')
            .replace(/[^a-zA-Z0-9\s_-]/g, '').replace(/\s+/g, '_').substring(0, 40) || 'LSTB_Team';
        const dateStr = new Date().toISOString().slice(0, 10);

        const link      = document.createElement('a');
        link.download   = `${title}_${dateStr}.png`;
        link.href       = dataUrl;
        link.click();

        btn.innerHTML          = 'Saved!';
        btn.style.borderColor  = '#059669';
        btn.style.color        = '#34d399';
        setTimeout(() => {
            btn.innerHTML         = origHTML;
            btn.disabled          = false;
            btn.style.borderColor = '';
            btn.style.color       = '';
        }, 2200);

    } catch (err) {
        console.error('[Export PNG]', err);
        // Restore icons if something went wrong mid-render
        document.querySelectorAll('i[class*="fa-"]').forEach(i => {
            i.style.display = i._origDisplay || '';
        });
        alert('Export failed: ' + err.message);
        btn.innerHTML = origHTML;
        btn.disabled  = false;
    }
}
