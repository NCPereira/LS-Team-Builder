// ── cards.js ──────────────────────────────────────────────────────────────────
// All card filename data and card name database.
// Loaded before index.html scripts that depend on these globals.

// ── Card list ─────────────────────────────────────────────────────────────────
// Format: 'Card_InternalName_01'
// To add a card: append here AND add a row to cardNames below.

const rawCards = [
    'Card_Agravaine_01', 'Card_Anessa_01',    'Card_Asuka_01',      'Card_Balin_01',
    'Card_Bedivere_01',  'Card_NeoBedivere_01','Card_Cain_01',       'Card_Claire_01',
    'Card_Belsey_01',    'Card_Cristina_01',   'Card_DianCecht_01',  'Card_Elaine_01',
    'Card_Elin_01',      'Card_Elizabeth_01',  'Card_Enya_01',       'Card_Erin_01',
    'Card_Esmeralda_01', 'Card_Estheria_01',   'Card_Ethan_01',      'Card_AbyssF30_01',
    'Card_Eva_01',       'Card_Gaheris_01',    'Card_Galahad_01',    'Card_Gawain_01',
    'Card_Guinevere_01', 'Card_Hikage_01',     'Card_Isabel_01',     'Card_Isolde_01',
    'Card_JoanOfArc_01', 'Card_Jessi_01',      'Card_Ran_01',        'Card_Karishara_01',
    'Card_Katrin_01',    'Card_Kay_01',        'Card_Circe_01',      'Card_Lancelot_01',
    'Card_Lilith_01',    'Card_Lisa_01',       'Card_Lohengrin_01',  'Card_Lua_01',
    'Card_Lucius_01',    'Card_Lucy_01',       'Card_Lueira_01',     'Card_Rowena_01',
    'Card_AbyssF60_01',  'Card_Merlin_01',     'Card_SMerry_01',     'Card_Mia_01',
    'Card_Mordred_01',   'Card_Morgana_01',    'Card_MorganLeFay_01','Card_Morgause_01',
    'Card_Nesha_01',     'Card_Nimue_01',      'Card_Palamedes_01',  'Card_Percival_01',
    'Card_Rachel_01',    'Card_Ria_01',        'Card_Rita_01',       'Card_MaidRita_01',
    'Card_Sarah_01',     'Card_Tiamat_01',     'Card_Tristan_01',    'Card_Urien_01',
    'Card_Vivien_01',    'Card_Vortigern_01',  'Card_Yumi_01',       'Card_Lumi_01',
    'Card_Merry_01',     'Card_Ray_01',        'Card_Isis_01',
];

// ── Card name database ────────────────────────────────────────────────────────
// Maps internal filename (no 'Card_' prefix, no '_01' suffix) →
//   { cardName: 'Displayed card title', charName: 'Character name' }
//
// cardName : the actual in-game card title shown on the card
// charName : the character the card belongs to (shown in parentheses below)
//
// To add a card: add a row here matching the filename middle segment.
// Example: 'Card_Anessa_01' → key is 'Anessa'

const cardNames = {
//  Key (filename segment)   cardName                         charName
    'Agravaine':           { cardName: 'Hidden in the Shadows', charName: 'Agravaine'  },
    'Anessa':              { cardName: 'Lingering Allure',    charName: 'Anessa'       },
    'Asuka':               { cardName: 'Take Training Seriously!',charName: 'Asuka'    },
    'Balin':               { cardName: 'Instant Counter',     charName: 'Balin'        },
    'Bedivere':            { cardName: 'World Tree\'s Energy',charName: 'Bedivere'     },
    'NeoBedivere':         { cardName: 'Awakened Power',      charName: 'NeoBedivere'  },
    'Cain':                { cardName: 'Swordmaster',         charName: 'Cain'         },
    'Claire':              { cardName: 'Martial Arts Training', charName: 'Claire'     },
    'Belsey':              { cardName: 'Queen\'s Morning',    charName: 'Belsey'       },
    'Cristina':            { cardName: 'Rose Flame',          charName: 'Cristina'     },
    'DianCecht':           { cardName: 'Witch of Light',      charName: 'DianCecht'    },
    'Elaine':              { cardName: 'Water Spirit',        charName: 'Elaine'       },
    'Elin':                { cardName: 'Evasive Maneuver',    charName: 'Elin'         },
    'Elizabeth':           { cardName: 'Absolute Armor',      charName: 'Elizabeth'    },
    'Enya':                { cardName: 'Manager\'s Dignity',  charName: 'Enya'         },
    'Erin':                { cardName: 'Princess of Smiles',  charName: 'Erin'         },
    'Esmeralda':           { cardName: 'Incarnation',         charName: 'Esmeralda'    },
    'Estheria':            { cardName: 'Quiet Temptation',    charName: 'Estheria'     },
    'Ethan':               { cardName: 'Holy Sword\'s Blessing', charName: 'Ethan'     },
    'AbyssF30':            { cardName: 'Holy Grail Spirit',   charName: 'Abyss F30'    },
    'Eva':                 { cardName: 'Quenched at Last',    charName: 'Eva'          },
    'Gaheris':             { cardName: 'Knitting Master',     charName: 'Gaheris'      },
    'Galahad':             { cardName: 'Knight of Purity',    charName: 'Galahad'      },
    'Gawain':              { cardName: 'Green Belt',          charName: 'Gawain'       },
    'Guinevere':           { cardName: 'First Tactics',       charName: 'Guinevere'    },
    'Hikage':              { cardName: 'Mission Complete',    charName: 'Hikage'       },
    'Isabel':              { cardName: 'Titanomachia',        charName: 'Isabel'       },
    'Isis':                { cardName: 'Barbarian’s Will',    charName: 'Isis'         },
    'Isolde':              { cardName: 'Art of Healing',      charName: 'Isolde'       },
    'JoanOfArc':           { cardName: 'Fighting Spirit',     charName: 'Joan Of Arc'  },
    'Jessi':               { cardName: 'Maintenance',         charName: 'Jessi'        },
    'Ran':                 { cardName: 'Moonlight Swordplay', charName: 'Ran'          },
    'Karishara':           { cardName: 'Exclusive to First Love', charName: 'Karishara'},
    'Katrin':              { cardName: 'Ice Empress',         charName: 'Katrin'       },
    'Kay':                 { cardName: 'Flame Emperor',       charName: 'Kay'          },
    'Circe':               { cardName: 'Carpe Diem',          charName: 'Circe'        },
    'Lancelot':            { cardName: 'Clumsy Lover',        charName: 'Lancelot'     },
    'Lilith':              { cardName: 'Charm',               charName: 'Lilith'       },
    'Lisa':                { cardName: 'Smile in the Dark',   charName: 'Lisa'         },
    'Lohengrin':           { cardName: 'Eternal Bond',        charName: 'Lohengrin'    },
    'Lua':                 { cardName: 'Elgrad Sword Art Journal', charName: 'Lua'     },
    'Lucius':              { cardName: 'Lifelong Contract',   charName: 'Lucius'       },
    'Lucy':                { cardName: 'Sturdy Strength',     charName: 'Lucy'         },
    'Lueira':              { cardName: 'Sweet Afternoon',     charName: 'Lueira'       },
    'Rowena':              { cardName: 'Demon Pact',          charName: 'Rowena'       },
    'AbyssF60':            { cardName: 'Red Dragon’s Blessing', charName: 'Abyss F60'  },
    'Merlin':              { cardName: 'Water Dragon’s Blessing', charName: 'Merlin'   },
    'SMerry':              { cardName: 'Fiery Gaze',          charName: 'S. Merry'     },
    'Mia':                 { cardName: 'Spill',               charName: 'Mia'          },
    'Mordred':             { cardName: 'Eye of Vengeance',    charName: 'Mordred'      },
    'Morgana':             { cardName: 'Fairy Queen',         charName: 'Morgana'      },
    'MorganLeFay':         { cardName: 'Queen’s Temptation',  charName: 'Morgan Le Fay'},
    'Merry':               { cardName: 'Reflex Nerves',       charName: 'Merry'        },
    'Morgause':            { cardName: 'Obedience',           charName: 'Morgause'     },
    'Nesha':               { cardName: 'Constricting Gaze',   charName: 'Nesha'        },
    'Nimue':               { cardName: 'Spirit’s Favor',      charName: 'Nimue'        },
    'Palamedes':           { cardName: 'A Girl’s Secrets',    charName: 'Palamedes'    },
    'Percival':            { cardName: 'Prydwen',             charName: 'Percival'     },
    'Rachel':              { cardName: 'Eastern Medicine',    charName: 'Rachel'       },
    'Ray':                 { cardName: 'Massacre',            charName: 'Ray'          },
    'Ria':                 { cardName: 'Gourmet',             charName: 'Ria'          },
    'Rita':                { cardName: 'Barista',             charName: 'Rita'         },
    'MaidRita':            { cardName: 'Lovely Maid',         charName: 'Maid Rita'    },
    'Sarah':               { cardName: 'Glutton',             charName: 'Sarah'        },
    'Tiamat':              { cardName: 'Doom Goddess',        charName: 'Tiamat'       },
    'Tristan':             { cardName: 'Unerring Bow',        charName: 'Tristan'      },
    'Urien':               { cardName: 'Magic Defense',       charName: 'Urien'        },
    'Vivien':              { cardName: 'Madness',             charName: 'Vivien'       },
    'Vortigern':           { cardName: 'Absolute Monarchy',   charName: 'Abyss F90'    },
    'Yumi':                { cardName: 'Between Snowflakes',  charName: 'Yumi'         },
    'Lumi':                { cardName: 'Leadership',          charName: 'Lumi'         },
};

// ── Helper: get card info from a stored card display name ─────────────────────
// slot.card stores the display name (e.g. "Lingering Allure (Anessa)").

function getCardInfo(displayName) {
    if (!displayName) return null;
    // Try direct key match first
    if (cardNames[displayName]) return cardNames[displayName];
    // Try matching against cardName or charName values
    const entry = Object.values(cardNames).find(
        c => c.cardName === displayName || c.charName === displayName
    );
    return entry || null;
}

// Build a lookup: cardName → entry (for fast search)
const _cardNameIndex = {};
Object.values(cardNames).forEach(entry => {
    if (entry.cardName) _cardNameIndex[entry.cardName.toLowerCase()] = entry;
    if (entry.charName) _cardNameIndex[entry.charName.toLowerCase()] = entry;
});
