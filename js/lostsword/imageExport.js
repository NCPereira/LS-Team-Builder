// ── imageExport.js ────────────────────────────────────────────────────────────
// PNG export via html2canvas.
// Depends on: html2canvas (loaded in index.html)

async function exportCapturePNG() {
    const btn = document.getElementById('export-png-btn');

    const teamWrapper = document.getElementById('team-stats-wrapper');
    const petsSection = teamWrapper ? teamWrapper.nextElementSibling : null;
    const primaryTarget = document.getElementById('team-grid');

    if (!primaryTarget || typeof html2canvas === 'undefined') {
        alert('html2canvas not loaded yet — try again in a moment.');
        return;
    }

    const origHTML = btn.innerHTML;
    btn.innerHTML = 'Rendering…';
    btn.disabled = true;

    try {
        const tempWrap = document.createElement('div');
        tempWrap.style.cssText = [
            'position:fixed',
            'top:-99999px',
            'left:0',
            'background:#0f111a',
            'padding:0px',
            'box-sizing:border-box',
            'z-index:-1',
            'display:inline-block'
        ].join(';');

        if (teamWrapper) {
            const clone1 = teamWrapper.cloneNode(true);
            tempWrap.appendChild(clone1);
        }

        if (petsSection && petsSection.tagName === 'SECTION') {
            const clone2 = petsSection.cloneNode(true);
            clone2.style.marginTop = '16px';
            tempWrap.appendChild(clone2);
        }

        document.body.appendChild(tempWrap);

        tempWrap.querySelectorAll('i[class*="fa-"]').forEach(icon => {
            icon.style.display = 'none';
        });

        tempWrap.querySelectorAll('.form-slot-forward, .form-slot-center, .form-slot-backward').forEach(el => {
            el.style.background = 'transparent';
        });

        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

        const contentWidth  = tempWrap.offsetWidth;
        const contentHeight = tempWrap.offsetHeight;

        const canvas = await html2canvas(tempWrap, {
            useCORS:         true,
            allowTaint:      false,
            backgroundColor: '#0f111a',
            scale:           2,
            logging:         false,
            imageTimeout:    0,
            width:           contentWidth,
            height:          contentHeight,
        });

        document.body.removeChild(tempWrap);

        const dataUrl = canvas.toDataURL('image/png');
        const title = (document.querySelector('h1[contenteditable]')?.innerText?.trim() || 'LSTB_Team')
            .replace(/[^a-zA-Z0-9\s_-]/g, '').replace(/\s+/g, '_').substring(0, 40) || 'LSTB_Team';
        const dateStr = new Date().toISOString().slice(0, 10);
        const link = document.createElement('a');
        link.download = `${title}_${dateStr}.png`;
        link.href = dataUrl;
        link.click();

        btn.innerHTML = 'Saved!';
        btn.style.borderColor = '#059669';
        btn.style.color = '#34d399';
        setTimeout(() => {
            btn.innerHTML = origHTML;
            btn.disabled  = false;
            btn.style.borderColor = '';
            btn.style.color = '';
        }, 2200);

    } catch (err) {
        console.error('[Export PNG]', err);
        alert('Export failed: ' + err.message);
        btn.innerHTML = origHTML;
        btn.disabled  = false;
        const tw = document.body.querySelector('[style*="top:-99999px"]');
        if (tw) document.body.removeChild(tw);
    }
}
