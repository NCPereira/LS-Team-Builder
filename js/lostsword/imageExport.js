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

        // ── Step 3: Replace textareas with divs (html2canvas can't read .value)
        const liveTAs = target.querySelectorAll('textarea');
        clone.querySelectorAll('textarea').forEach((cloneTa, idx) => {
            const liveTa = liveTAs[idx];
            const value  = liveTa ? liveTa.value : '';
            const cs     = liveTa ? window.getComputedStyle(liveTa) : null;

            const div = document.createElement('div');
            if (cs) {
                [
                    'width','height','minHeight','maxHeight','boxSizing',
                    'padding','paddingTop','paddingBottom','paddingLeft','paddingRight',
                    'fontSize','fontWeight','fontFamily','lineHeight','letterSpacing',
                    'color','backgroundColor','background',
                    'border','borderColor','borderWidth','borderStyle','borderRadius',
                    'whiteSpace','wordBreak','overflowWrap','textAlign',
                ].forEach(p => { try { div.style[p] = cs[p]; } catch(_){} });
            }
            div.style.display    = 'block';
            div.style.overflow   = 'hidden';
            div.style.whiteSpace = 'pre-wrap';

            if (value.trim() === '') {
                div.textContent     = cloneTa.getAttribute('placeholder') || '';
                div.style.color     = '#475569';
                div.style.fontStyle = 'italic';
            } else {
                div.textContent = value;
            }
            cloneTa.parentNode.replaceChild(div, cloneTa);
        });

        // ── Step 4: Hide FontAwesome icons ───────────────────────────────────
        clone.querySelectorAll('i[class*="fa-"]').forEach(i => {
            i.style.display = 'none';
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
            'background: #0f111a',
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
            backgroundColor: '#0f111a',
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
                // Hide FA icons
                doc.querySelectorAll('i[class*="fa-"]').forEach(i => i.style.display = 'none');
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
