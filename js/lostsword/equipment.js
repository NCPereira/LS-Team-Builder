// ── equipment.js ─────────────────────────────────────────────────────────────
// Weapon, armor, helmet, and rune databases.
// Loaded before teamgrid.js which builds db.Weapon / db.Armor / etc.
//
// EACH ENTRY SUPPORTS:
//   name         : display name (required)
//   file         : kebab-case image filename, no extension (required)
//   class        : 'Knight' | 'Archer' | 'Wizard' | 'Healer'  — single class only
//   classes      : ['Wizard','Healer']  — array of allowed classes
//   excludeClass : 'Healer'             — everyone EXCEPT this class
//   unique       : true                 — only one character on the team can equip it
//
// TO ADD AN ITEM: push a new object to the relevant array below.

// ─── Weapons ──────────────────────────────────────────────────────────────────
// Images live at: Assets/lostsword/weapons/<file>.webp

const WEAPONS = [
    { name: 'Abyssal Bow',                file: 'abyssal-bow',               class: 'Archer'  },
    { name: 'Abyssal Greatsword',         file: 'abyssal-greatsword',        class: 'Knight'  },
    { name: 'Abyssal Staff',              file: 'abyssal-staff',             class: 'Wizard'  },
    { name: 'Aquarius',                   file: 'aquarius',                  class: 'Healer'  },
    { name: 'Arbalest',                   file: 'arbalest',                  class: 'Archer'  },
    { name: 'Arguros Toxos',              file: 'arguros-toxos',             class: 'Archer'  },
    { name: 'Arondight',                  file: 'arondight',                 class: 'Knight'  },
    { name: 'Balisada',                   file: 'balisada',                  class: 'Knight',  unique: true },
    { name: 'Claiomh Solais Chaotic',     file: 'claiomh-solais-chaotic',    class: 'Wizard',  unique: true },
    { name: 'Cosmic Axe',                 file: 'cosmic-axe',                class: 'Knight'  },
    { name: 'Death Scythe',               file: 'death-scythe',              class: 'Wizard'  },
    { name: 'Demon Blade Hellhad',        file: 'demon-blade-hellhad',       class: 'Knight'  },
    { name: 'Dragon Buster',              file: 'dragon-buster',             class: 'Wizard'  },
    { name: 'Dragon Killer',              file: 'dragon-killer',             class: 'Archer'  },
    { name: 'Dragon Slayer',              file: 'dragon-slayer',             class: 'Knight'  },
    { name: 'DualBlade',                  file: 'dual-blade',                class: 'Knight',  unique: true },
    { name: 'Durendal',                   file: 'durendal',                  class: 'Knight'  },
    { name: 'Failnaught',                 file: 'failnaught',                class: 'Archer',  unique: true },
    { name: 'Fire Dragon\'s Banner',      file: 'fire-dragons-banner',       class: 'Healer'  },
    { name: 'Fire Dragon\'s Curved Sword',file: 'fire-dragons-curved-sword', class: 'Knight'  },
    { name: 'Fire Dragon\'s Great Bow',   file: 'fire-dragons-great-bow',    class: 'Archer'  },
    { name: 'Fragarach',                  file: 'fragarach',                 class: 'Knight'  },
    { name: 'Gambanteinn',                file: 'gambanteinn',               classes: ['Wizard','Healer'] },
    { name: 'Goblin Slasher',             file: 'goblin-slasher',            class: 'Knight'  },
    { name: 'Goddess Bow',                file: 'goddess-bow',               class: 'Archer'  },
    { name: 'Goddess Greatsword',         file: 'goddess-greatsword',        class: 'Knight'  },
    { name: 'Goddess Staff',              file: 'goddess-staff',             class: 'Wizard'  },
    { name: 'Heavy Bow',                  file: 'heavy-bow',                 class: 'Archer'  },
    { name: 'Holy Fire Bow',              file: 'holy-fire-bow',             class: 'Archer'  },
    { name: 'Holy Fire Staff',            file: 'holy-fire-staff',           class: 'Wizard'  },
    { name: 'Holy Fire Sword',            file: 'holy-fire-sword',           class: 'Knight'  },
    { name: 'Infinity Staff',             file: 'infinity-staff',            classes: ['Wizard','Healer'], unique: true },
    { name: 'Iokheira',                   file: 'iokheira',                  class: 'Archer'  },
    { name: 'Rampage Bow',                file: 'rampage-bow',               class: 'Archer'  },
    { name: 'Red Dragon Tooth',           file: 'red-dragon-tooth',          class: 'Knight'  },
    { name: 'Red Ribboned Bow',           file: 'red-ribboned-bow',          class: 'Archer'  },
    { name: 'Red Ribboned Staff',         file: 'red-ribboned-staff',        class: 'Wizard'  },
    { name: 'Red Ribboned Sword',         file: 'red-ribboned-sword',        class: 'Knight'  },
    { name: 'Royal Cow Axe',              file: 'royal-cow-axe',             class: 'Knight'  },
    { name: 'Royal Cow Bowgun',           file: 'royal-cow-bowgun',          class: 'Archer'  },
    { name: 'Royal Cow Staff',            file: 'royal-cow-staff',           class: 'Wizard'  },
    { name: 'Sagittarius',                file: 'sagittarius',               class: 'Archer'  },
    { name: 'Sumarbrander',               file: 'sumarbrander',              class: 'Knight'  },
    { name: 'Tempest Bow',                file: 'tempest-bow',               class: 'Archer'  },
    { name: 'Tempest Staff',              file: 'tempest-staff',             classes: ['Wizard','Healer'] },
    { name: 'Tempest Sword',              file: 'tempest-sword',             class: 'Knight'  },
    { name: 'Thunderclap',                file: 'thunderclap',               class: 'Wizard'  },
    { name: 'Trident',                    file: 'trident',                   class: 'Knight',  unique: true },
    { name: 'Tyrfingr',                   file: 'tyrfingr',                  class: 'Knight'  },
    { name: 'Void Staff',                 file: 'void-staff',                classes: ['Wizard','Healer'] },
    { name: 'White Feather Fan',          file: 'white-feather-fan',         class: 'Wizard'  },
];

// ─── Armor ────────────────────────────────────────────────────────────────────
// Images live at: Assets/lostsword/armor/<file>.webp

const ARMORS = [
    { name: 'Royal Cow Armor',      file: 'royal-cow-armor'      },
    { name: 'Silver Armor',         file: 'silver-armor'         },
    { name: 'Gold Armor',           file: 'gold-armor'           },
    { name: 'Abyssal Armor',        file: 'abyssal-armor'        },
    { name: 'Dragon Armor',         file: 'dragon-armor'         },
    { name: 'Red Ribboned Robe',    file: 'red-ribboned-robe'    },
    { name: 'Tempest Armor',        file: 'tempest-armor'        },
    { name: 'Gorgon Armor',         file: 'gorgon-armor'         },
    { name: 'Holy Fire Armor',      file: 'holy-fire-armor'      },
    { name: 'Mirror armor',         file: 'mirror-armor',         unique: true },
    { name: 'Mithril armor',        file: 'mithril-armor'        },
    { name: 'Merlin\'s Robe',       file: 'merlins-robe'         },
    { name: 'Armor of the dead',    file: 'armor-of-the-dead'    },
    { name: 'Fire Dragon\'s Armor', file: 'fire-dragons-armor'   },
    { name: 'Wild Combat Suit',     file: 'wild-combat-suit'     },
    { name: 'Wrath of Agnes',       file: 'wrath-of-agnes',       unique: true },
    { name: 'Goddess Armor',        file: 'goddess-armor'        },
    { name: 'Absolute Armor',       file: 'absolute-armor',       unique: true },
];

// ─── Helmets ──────────────────────────────────────────────────────────────────
// Images live at: Assets/lostsword/helmets/<file>.webp

const HELMETS = [
    { name: 'Abyssal Ring',           file: 'abyssal-ring'           },
    { name: 'Achilles Helmet',        file: 'achilles-helmet'        },
    { name: 'Aegis',                  file: 'aegis'                  },
    { name: 'Claiomh Solais Ring',    file: 'claiomh-solais-ring'    },
    { name: 'Crown Of The Dead',      file: 'crown-of-the-dead'      },
    { name: 'Fire Dragon\'s Helmet',  file: 'fire-dragons-helmet'    },
    { name: 'Goddess Ring',           file: 'goddess-ring'           },
    { name: 'Healing Goddess Statue', file: 'healing-goddess-statue' },
    { name: 'Holy Fire Helmet',       file: 'holy-fire-helmet'       },
    { name: 'jade Seal',              file: 'jade-seal'              },
    { name: 'Red Hare',               file: 'red-hare',               unique: true },
    { name: 'Red Ribboned Ring',      file: 'red-ribboned-ring'      },
    { name: 'Royal Cow Crown',        file: 'royal-cow-crown'        },
    { name: 'Stiletto Of Jealousy',   file: 'stiletto-of-jealousy',   unique: true },
    { name: 'Tempest Helmet',         file: 'tempest-helmet'         },
    { name: 'Tiamat\'s Signature',    file: 'tiamat-signature',       unique: true },
    { name: 'Transformation Scroll',  file: 'transformation-scroll',  unique: true },
    { name: 'Wild Hair Band',         file: 'wild-hair-band'         },
    { name: 'Destrutions Favor',      file: 'destructions-favor',     unique: true },
];

// ─── Runes ────────────────────────────────────────────────────────────────────
// Images live at: Assets/lostsword/runes/<file>.webp

const RUNES = [
    { name: 'Abyssal Rune',         file: 'abyssal-rune'         },
    { name: 'Celestial Rune',       file: 'celestial-rune',       unique: true },
    { name: 'Claiomh Solais Rune',  file: 'claiomh-solais-rune'  },
    { name: 'Extreme Rune',         file: 'extreme-rune',         unique: true },
    { name: 'Goddess Rune',         file: 'goddess-rune'         },
    { name: 'Holy Fire Rune',       file: 'holy-fire-rune'       },
    { name: 'Memories Of Flame',    file: 'memories-of-flame',    unique: true },
    { name: 'Red Ribboned Rune',    file: 'red-ribboned-rune'    },
    { name: 'Royal Cow Rune',       file: 'royal-cow-rune'       },
    { name: 'Rune Of Healing',      file: 'rune-of-healing',      class: 'Healer' },
    { name: 'Rune Of Focus',        file: 'rune-of-focus',        excludeClass: 'Healer' },
    { name: 'Rune Of The Deep Sea', file: 'rune-of-the-deep-sea' },
    { name: 'Swordbringer Rune',    file: 'swordbringer-rune'    },
    { name: 'Tempest Rune',         file: 'tempest-rune'         },
    { name: 'ThunderHeart',         file: 'thunderheart'         },
];

// ─── Compatibility shims for teamgrid.js ──────────────────────────────────────
// teamgrid.js reads rawWeapons / weaponFilenames / weaponClasses etc. to build
// db.Weapon. These shims derive those three shapes from the unified arrays above
// so teamgrid.js needs no changes.

const rawWeapons = WEAPONS.map(w => w.name);
const weaponFilenames = Object.fromEntries(WEAPONS.map(w => [w.name, w.file]));
const weaponClasses   = Object.fromEntries(WEAPONS.map(w => [w.name, {
    ...(w.class        && { class:        w.class        }),
    ...(w.classes      && { classes:      w.classes      }),
    ...(w.excludeClass && { excludeClass: w.excludeClass }),
    ...(w.unique       && { unique:       w.unique       }),
}]));

const rawArmor = ARMORS.map(a => a.name);
const armorFilenames = Object.fromEntries(ARMORS.map(a => [a.name, a.file]));
const armorClasses   = Object.fromEntries(ARMORS.filter(a => a.unique || a.class || a.excludeClass).map(a => [a.name, {
    ...(a.class        && { class:        a.class        }),
    ...(a.excludeClass && { excludeClass: a.excludeClass }),
    ...(a.unique       && { unique:       a.unique       }),
}]));

const rawHelmets = HELMETS.map(h => h.name);
const helmetFilenames = Object.fromEntries(HELMETS.map(h => [h.name, h.file]));
const helmetClasses   = Object.fromEntries(HELMETS.filter(h => h.unique || h.class || h.excludeClass).map(h => [h.name, {
    ...(h.class        && { class:        h.class        }),
    ...(h.excludeClass && { excludeClass: h.excludeClass }),
    ...(h.unique       && { unique:       h.unique       }),
}]));

const rawRunes = RUNES.map(r => r.name);
const runeFilenames = Object.fromEntries(RUNES.map(r => [r.name, r.file]));
const runeClasses   = Object.fromEntries(RUNES.filter(r => r.unique || r.class || r.excludeClass).map(r => [r.name, {
    ...(r.class        && { class:        r.class        }),
    ...(r.excludeClass && { excludeClass: r.excludeClass }),
    ...(r.unique       && { unique:       r.unique       }),
}]));
