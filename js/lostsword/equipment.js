// ── equipment.js ─────────────────────────────────────────────────────────────
// All weapon, armor, helmet, and rune data arrays, filename maps, and class
// restriction objects. Loaded before index.html scripts that depend on these globals.

// ─── Weapon Database ──────────────────────────────────────────────────────────
// ADD WEAPONS: push the display name to rawWeapons, add the filename to
// weaponFilenames (kebab-case, no extension), and restrict by class in
// weaponClasses if needed. Image must live at: weapons/<filename>.webp

const rawWeapons = [
    'Abyssal Bow', 'Abyssal Greatsword',
    'Abyssal Staff', 'Aquarius',
    'Arbalest', 'Arguros Toxos',
    'Arondight', 'Balisada',
    'Claiomh Solais Chaotic', 'Cosmic Axe',
    'Death Scythe', 'Demon Blade Hellhad',
    'Dragon Buster', 'Dragon Killer',
    'Dragon Slayer', 'DualBlade',
    'Durendal', 'Failnaught',
    'Fire Dragon\'s Banner', 'Fire Dragon\'s Curved Sword',
    'Fire Dragon\'s Great Bow', 'Fragarach',
    'Gambanteinn', 'Goblin Slasher',
    'Goddess Bow', 'Goddess Greatsword',
    'Goddess Staff', 'Heavy Bow',
    'Holy Fire Bow', 'Holy Fire Staff',
    'Holy Fire Sword', 'Infinity Staff',
    'Iokheira', 'Rampage Bow',
    'Red Dragon Tooth', 'Red Ribboned Bow',
    'Red Ribboned Staff', 'Red Ribboned Sword',
    'Royal Cow Axe', 'Royal Cow Bowgun',
    'Royal Cow Staff', 'Sagittarius',
    'Sumarbrander', 'Tempest Bow',
    'Tempest Staff', 'Tempest Sword',
    'Thunderclap', 'Trident',
    'Tyrfingr', 'Void Staff',
    'White Feather Fan',
];

const weaponFilenames = {
    'Abyssal Bow':                  'abyssal-bow',
    'Abyssal Greatsword':           'abyssal-greatsword',
    'Abyssal Staff':                'abyssal-staff',
    'Aquarius':                     'aquarius',
    'Arbalest':                     'arbalest',
    'Arguros Toxos':                'arguros-toxos',
    'Arondight':                    'arondight',
    'Balisada':                     'balisada',
    'Claiomh Solais Chaotic':       'claiomh-solais-chaotic',
    'Cosmic Axe':                   'cosmic-axe',
    'Death Scythe':                 'death-scythe',
    'Demon Blade Hellhad':          'demon-blade-hellhad',
    'Dragon Buster':                'dragon-buster',
    'Dragon Killer':                'dragon-killer',
    'Dragon Slayer':                'dragon-slayer',
    'DualBlade':                    'dual-blade',
    'Durendal':                     'durendal',
    'Failnaught':                   'failnaught',
    'Fire Dragon\'s Banner':        'fire-dragons-banner',
    'Fire Dragon\'s Curved Sword':  'fire-dragons-curved-sword',
    'Fire Dragon\'s Great Bow':     'fire-dragons-great-bow',
    'Fragarach':                    'fragarach',
    'Gambanteinn':                  'gambanteinn',
    'Goblin Slasher':               'goblin-slasher',
    'Goddess Bow':                  'goddess-bow',
    'Goddess Greatsword':           'goddess-greatsword',
    'Goddess Staff':                'goddess-staff',
    'Heavy Bow':                    'heavy-bow',
    'Holy Fire Bow':                'holy-fire-bow',
    'Holy Fire Staff':              'holy-fire-staff',
    'Holy Fire Sword':              'holy-fire-sword',
    'Infinity Staff':               'infinity-staff',
    'Iokheira':                     'iokheira',
    'Rampage Bow':                  'rampage-bow',
    'Red Dragon Tooth':             'red-dragon-tooth',
    'Red Ribboned Bow':             'red-ribboned-bow',
    'Red Ribboned Staff':           'red-ribboned-staff',
    'Red Ribboned Sword':           'red-ribboned-sword',
    'Royal Cow Axe':                'royal-cow-axe',
    'Royal Cow Bowgun':             'royal-cow-bowgun',
    'Royal Cow Staff':              'royal-cow-staff',
    'Sagittarius':                  'sagittarius',
    'Sumarbrander':                 'sumarbrander',
    'Tempest Bow':                  'tempest-bow',
    'Tempest Staff':                'tempest-staff',
    'Tempest Sword':                'tempest-sword',
    'Thunderclap':                  'thunderclap',
    'Trident':                      'trident',
    'Tyrfingr':                     'tyrfingr',
    'Void Staff':                   'void-staff',
    'White Feather Fan':            'white-feather-fan',
};

// Add unique: true to prevent an item being equipped on multiple characters.
const weaponClasses = {
    'Abyssal Bow':                { class: 'Archer' },
    'Abyssal Greatsword':         { class: 'Knight' },
    'Abyssal Staff':              { class: 'Wizard' },
    'Aquarius':                   { class: 'Healer' },
    'Arbalest':                   { class: 'Archer' },
    'Arguros Toxos':              { class: 'Archer' },
    'Arondight':                  { class: 'Knight' },
    'Balisada':                   { class: 'Knight',  unique: true },
    'Claiomh Solais Chaotic':     { class: 'Wizard',  unique: true },
    'Cosmic Axe':                 { class: 'Knight' },
    'Death Scythe':               { class: 'Wizard' },
    'Demon Blade Hellhad':        { class: 'Knight' },
    'Dragon Buster':              { class: 'Wizard' },
    'Dragon Killer':              { class: 'Archer' },
    'Dragon Slayer':              { class: 'Knight' },
    'DualBlade':                  { class: 'Knight',  unique: true },
    'Durendal':                   { class: 'Knight' },
    'Failnaught':                 { class: 'Archer',  unique: true },
    'Fire Dragon\'s Banner':      { class: 'Healer' },
    'Fire Dragon\'s Curved Sword':{ class: 'Knight' },
    'Fire Dragon\'s Great Bow':   { class: 'Archer' },
    'Fragarach':                  { class: 'Knight' },
    'Gambanteinn':                { classes: ['Wizard', 'Healer'] },
    'Goblin Slasher':             { class: 'Knight' },
    'Goddess Bow':                { class: 'Archer' },
    'Goddess Greatsword':         { class: 'Knight' },
    'Goddess Staff':              { class: 'Wizard' },
    'Heavy Bow':                  { class: 'Archer' },
    'Holy Fire Bow':              { class: 'Archer' },
    'Holy Fire Staff':            { class: 'Wizard' },
    'Holy Fire Sword':            { class: 'Knight' },
    'Infinity Staff':             { classes: ['Wizard', 'Healer'], unique: true },
    'Iokheira':                   { class: 'Archer' },
    'Rampage Bow':                { class: 'Archer' },
    'Red Dragon Tooth':           { class: 'Knight' },
    'Red Ribboned Bow':           { class: 'Archer' },
    'Red Ribboned Staff':         { class: 'Wizard' },
    'Red Ribboned Sword':         { class: 'Knight' },
    'Royal Cow Axe':              { class: 'Knight' },
    'Royal Cow Bowgun':           { class: 'Archer' },
    'Royal Cow Staff':            { class: 'Wizard' },
    'Sagittarius':                { class: 'Archer' },
    'Sumarbrander':               { class: 'Knight' },
    'Tempest Bow':                { class: 'Archer' },
    'Tempest Staff':              { classes: ['Wizard', 'Healer'] },
    'Tempest Sword':              { class: 'Knight' },
    'Thunderclap':                { class: 'Wizard' },
    'Trident':                    { class: 'Knight',  unique: true },
    'Tyrfingr':                   { class: 'Knight' },
    'Void Staff':                 { classes: ['Wizard', 'Healer'] },
    'White Feather Fan':          { class: 'Wizard' },
};

// ─── Armor Database ───────────────────────────────────────────────────────────
// ADD ARMOR: push the display name to rawArmor, add the filename to
// armorFilenames (kebab-case, no extension), and optionally restrict
// it to a class in armorClasses. Image must live at: armor/<filename>.webp

const rawArmor = [
    'Royal Cow Armor', 'Silver Armor',
    'Gold Armor', 'Abyssal Armor',
    'Dragon Armor', 'Red Ribboned Robe',
    'Tempest Armor', 'Gorgon Armor',
    'Holy Fire Armor', 'Mirror armor',
    'Mithril armor', 'Merlin\'s Robe',
    'Armor of the dead', 'Fire Dragon\'s Armor',
    'Wild Combat Suit', 'Wrath of Agnes',
    'Goddess Armor', 'Absolute Armor',
];

const armorFilenames = {
    'Royal Cow Armor':      'royal-cow-armor',
    'Silver Armor':         'silver-armor',
    'Gold Armor':           'gold-armor',
    'Abyssal Armor':        'abyssal-armor',
    'Dragon Armor':         'dragon-armor',
    'Red Ribboned Robe':    'red-ribboned-robe',
    'Tempest Armor':        'tempest-armor',
    'Gorgon Armor':         'gorgon-armor',
    'Holy Fire Armor':      'holy-fire-armor',
    'Mirror armor':         'mirror-armor',
    'Mithril armor':        'mithril-armor',
    'Merlin\'s Robe':       'merlins-robe',
    'Armor of the dead':    'armor-of-the-dead',
    'Fire Dragon\'s Armor': 'fire-dragons-armor',
    'Wild Combat Suit':     'wild-combat-suit',
    'Wrath of Agnes':       'wrath-of-agnes',
    'Goddess Armor':        'goddess-armor',
    'Absolute Armor':       'absolute-armor',
};

// Add unique: true to make that armor a one-slot-only item.
const armorClasses = {
    'Wrath of Agnes': { unique: true },
    'Mirror armor':   { unique: true },
    'Absolute Armor': { unique: true },
};

// ─── Helmet Database ──────────────────────────────────────────────────────────
// ADD HELMETS: same pattern as armor above.
// Image path: helmets/<filename>.webp

const rawHelmets = [
    'Abyssal Ring', 'Achilles Helmet',
    'Aegis', 'Claiomh Solais Ring',
    'Crown Of The Dead', 'Fire Dragon\'s Helmet',
    'Goddess Ring', 'Healing Goddess Statue',
    'Holy Fire Helmet', 'jade Seal', 'Red Hare',
    'Red Ribboned Ring', 'Royal Cow Crown',
    'Stiletto Of Jealousy', 'Tempest Helmet',
    'Tiamat\'s Signature', 'Transformation Scroll',
    'Wild Hair Band', 'Destrutions Favor',
];

const helmetFilenames = {
    'Abyssal Ring':           'abyssal-ring',
    'Achilles Helmet':        'achilles-helmet',
    'Aegis':                  'aegis',
    'Claiomh Solais Ring':    'claiomh-solais-ring',
    'Crown Of The Dead':      'crown-of-the-dead',
    'Fire Dragon\'s Helmet':  'fire-dragons-helmet',
    'Goddess Ring':           'goddess-ring',
    'Healing Goddess Statue': 'healing-goddess-statue',
    'Holy Fire Helmet':       'holy-fire-helmet',
    'jade Seal':              'jade-seal',
    'Red Hare':               'red-hare',
    'Red Ribboned Ring':      'red-ribboned-ring',
    'Royal Cow Crown':        'royal-cow-crown',
    'Stiletto Of Jealousy':   'stiletto-of-jealousy',
    'Tempest Helmet':         'tempest-helmet',
    'Tiamat\'s Signature':    'tiamat-signature',
    'Transformation Scroll':  'transformation-scroll',
    'Wild Hair Band':         'wild-hair-band',
    'Destrutions Favor':      'destructions-favor',
};

// Add unique: true to make that helmet a one-slot-only item.
const helmetClasses = {
    'Stiletto Of Jealousy':  { unique: true },
    'Transformation Scroll': { unique: true },
    'Tiamat\'s Signature':   { unique: true },
    'Red Hare':              { unique: true },
    'Destrutions Favor':     { unique: true },
};

// ─── Rune Database ────────────────────────────────────────────────────────────
// ADD RUNES: same pattern as armor above.
// Image path: runes/<filename>.webp

const rawRunes = [
    'Abyssal Rune', 'Celestial Rune',
    'Claiomh Solais Rune', 'Extreme Rune',
    'Goddess Rune', 'Holy Fire Rune',
    'Memories Of Flame', 'Red Ribboned Rune',
    'Royal Cow Rune', 'Rune Of Healing',
    'Rune Of Focus', 'Rune Of The Deep Sea',
    'Swordbringer Rune', 'Tempest Rune',
    'ThunderHeart',
];

const runeFilenames = {
    'Abyssal Rune':        'abyssal-rune',
    'Celestial Rune':      'celestial-rune',
    'Claiomh Solais Rune': 'claiomh-solais-rune',
    'Extreme Rune':        'extreme-rune',
    'Goddess Rune':        'goddess-rune',
    'Holy Fire Rune':      'holy-fire-rune',
    'Memories Of Flame':   'memories-of-flame',
    'Red Ribboned Rune':   'red-ribboned-rune',
    'Royal Cow Rune':      'royal-cow-rune',
    'Rune Of Healing':     'rune-of-healing',
    'Rune Of Focus':       'rune-of-focus',
    'Rune Of The Deep Sea':'rune-of-the-deep-sea',
    'Swordbringer Rune':   'swordbringer-rune',
    'Tempest Rune':        'tempest-rune',
    'ThunderHeart':        'thunderheart',
};

// Add unique: true or excludeClass: 'ClassName' as needed.
const runeClasses = {
    'Rune Of Healing':   { class: 'Healer' },
    'Rune Of Focus':     { excludeClass: 'Healer' },
    'Memories Of Flame': { unique: true },
    'Extreme Rune':      { unique: true },
    'Celestial Rune':    { unique: true },
};
