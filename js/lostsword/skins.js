// ── skins.js ──────────────────────────────────────────────────────────────────
// Skin candidate generation, runtime probe logic, and skin cycling helpers.
// Loaded before index.html scripts that depend on these globals.
//
// HOW IT WORKS
// ─────────────────────────────────────────────────────────────────────────────
// Rather than maintaining a hand-written list of every skin filename, candidates
// are generated automatically from CHARACTERS (characters.js).  The internal
// name from each character entry (e.g. "Pc_Lancelot_01") is used to derive the
// skin stem ("Sk_Lancelot"), then _SKIN_MAX_PROBE variants (_01 … _0N) are
// probed at runtime.  Only files that actually load are kept.
//
// IRREGULAR FILENAMES
// A small override map handles cases where the skin filename doesn't match the
// character's internal name (e.g. Ray's skins are filed under "Sk_Rey_*").
//
// ADDING A NEW CHARACTER
//   • If their skins follow the standard pattern (Sk_<InternalName>_0x) nothing
//     needs to change here — they are picked up automatically.
//   • If their skin filename is irregular, add one entry to _SKIN_STEM_OVERRIDES.
//
// MAX PROBE DEPTH
//   Change _SKIN_MAX_PROBE to raise the ceiling for characters that may have
//   more than 3 skins in a future update.

// Maximum number of skin variants to probe per character (Sk_X_01 … Sk_X_0N).
const _SKIN_MAX_PROBE = 5;

// Override map: display name → skin filename stem (no number, no extension).
// Only needed when the skin filename capitalisation differs from the internal name.
const _SKIN_STEM_OVERRIDES = {
    // Internal name is 'Pc_Morganlefay_01' (lowercase l/f) but skin files
    // on disk use 'Sk_MorganLeFay_*' (capital L and F).
    'Morgan Le Fay': 'Sk_MorganLeFay',
};

// ── Auto-generate _skinCandidates from CHARACTERS ────────────────────────────
// CHARACTERS is defined in characters.js which is loaded before this file.
// Each entry looks like { internalName: 'Pc_Lancelot_01', … }.
// We strip "Pc_" and "_01" to get the stem, then prepend "Sk_".

function _buildSkinCandidates() {
    const result = {};

    CHARACTERS.forEach(c => {
        // Derive the display name the same way parseName() does.
        const displayName = parseName(c.internalName);

        // Derive the skin stem: strip leading "Pc_" and trailing "_NN".
        // e.g.  "Pc_Lancelot_01"  →  "Lancelot"  →  "Sk_Lancelot"
        //        "Pc_MaidRita_01"  →  "MaidRita"   →  "Sk_MaidRita"
        const parts    = c.internalName.split('_');
        const namePart = parts[1] || parts[0];   // middle segment
        const defaultStem = 'Sk_' + namePart;

        // Use the override if one exists, otherwise fall back to the default.
        const stem = _SKIN_STEM_OVERRIDES[displayName] || defaultStem;

        // Generate candidate stems: Sk_X_01, Sk_X_02, … Sk_X_0N
        result[displayName] = Array.from(
            { length: _SKIN_MAX_PROBE },
            (_, i) => `${stem}_0${i + 1}`
        );
    });

    return result;
}

// Build once on load.  Everything else in this file reads _skinCandidates as
// before — no other file needs to change.
const _skinCandidates = _buildSkinCandidates();

// ── Resolved cache ────────────────────────────────────────────────────────────
// charName → string[] of confirmed-existing stems, 'pending' while probing,
// or undefined if not yet started.
const _resolvedSkins = {};

// Probe a single image URL; resolves true if it loads, false on error/404.
function _probeImage(url) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload  = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
    });
}

async function _probeSkins(charName) {
    if (_resolvedSkins[charName] !== undefined) return; // already probing / done
    _resolvedSkins[charName] = 'pending';

    const candidates = _skinCandidates[charName] || [];
    const confirmed  = [];

    for (const stem of candidates) {
        const url = `Assets/lostsword/skins/${stem}.webp`;
        const ok  = await _probeImage(url);
        if (ok) {
            confirmed.push(stem);
        } else {
            // Skins are numbered sequentially — first miss means no more exist.
            break;
        }
    }

    _resolvedSkins[charName] = confirmed;

    // Re-render panels so the swap button / dots reflect the real count.
    if (typeof renderTeamGrid         === 'function') renderTeamGrid();
    // renderTeamGrid calls updateFormation internally, but also call it
    // directly so formation icons always reflect the active skin.
    if (typeof updateFormation        === 'function') updateFormation();
    if (typeof renderUltimateRotation === 'function') renderUltimateRotation();
    if (typeof bstatDealt !== 'undefined' && bstatDealt && typeof renderBStatBars === 'function') renderBStatBars();
}

// Return the confirmed skins array for a character, or null if still loading.
function getSkins(charName) {
    if (!charName || !_skinCandidates[charName]) return [];
    const cached = _resolvedSkins[charName];
    if (cached === undefined) {
        _probeSkins(charName); // fire async probe
        return null;           // null = "still loading — show no button yet"
    }
    if (cached === 'pending') return null;
    return cached; // [] = no skins found, ['Sk_...'] = one or more confirmed
}

// ── Per-slot skin state ───────────────────────────────────────────────────────
// 0 = base character image, 1+ = index into the confirmed skins array.
let slotSkinIndex = [0, 0, 0, 0, 0];

// Return the correct image src for a team slot (base or active skin).
function getSlotCharImg(slotIndex) {
    const slot = slotData[slotIndex];
    if (!slot || !slot.character) return null;

    const skinIdx = slotSkinIndex[slotIndex];
    if (skinIdx > 0) {
        const skins = _resolvedSkins[slot.character];
        if (Array.isArray(skins) && skins[skinIdx - 1]) {
            return `Assets/lostsword/skins/${skins[skinIdx - 1]}.webp`;
        }
    }

    const charData = db.characters.find(c => c.name === slot.character);
    return charData ? charData.img : null;
}

// Cycle skin for a slot: base → skin1 → skin2 → … → base
function cycleSkin(slotIndex, event) {
    event.stopPropagation();
    const slot = slotData[slotIndex];
    if (!slot || !slot.character) return;

    const skins = _resolvedSkins[slot.character];
    if (!Array.isArray(skins) || skins.length === 0) return;

    const total = skins.length + 1; // +1 for the base image
    slotSkinIndex[slotIndex] = (slotSkinIndex[slotIndex] + 1) % total;

    if (typeof renderTeamGrid         === 'function') renderTeamGrid();
    // renderTeamGrid calls updateFormation internally, but also call it
    // directly so formation icons always reflect the active skin.
    if (typeof updateFormation        === 'function') updateFormation();
    if (typeof renderUltimateRotation === 'function') renderUltimateRotation();
    if (typeof bstatDealt !== 'undefined' && bstatDealt && typeof renderBStatBars === 'function') renderBStatBars();
}
