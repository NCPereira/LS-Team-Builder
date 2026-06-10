// ── cards.js ──────────────────────────────────────────────────────────────────
// All card data in one place.
// Loaded before index.html scripts that depend on these globals.

// ── Master card list ──────────────────────────────────────────────────────────
// Each entry:
//   internalName : the 'Card_Name_01' filename stem (drives image paths)
//   cardName     : the actual in-game card title shown on the card
//   charName     : the character the card belongs to (shown in parentheses below)
//
// TO ADD A CARD: push one object here. That's it.

const CARDS = [
//  internalName               cardName                          charName
    { internalName: 'Card_Agravaine_01',    cardName: 'Hidden in the Shadows',    charName: 'Agravaine'      },
    { internalName: 'Card_Anessa_01',       cardName: 'Lingering Allure',         charName: 'Anessa'         },
    { internalName: 'Card_Asuka_01',        cardName: 'Take Training Seriously!', charName: 'Asuka'          },
    { internalName: 'Card_Balin_01',        cardName: 'Instant Counter',          charName: 'Balin'          },
    { internalName: 'Card_Bedivere_01',     cardName: "World Tree's Energy",      charName: 'Bedivere'       },
    { internalName: 'Card_NeoBedivere_01',  cardName: 'Awakened Power',           charName: 'NeoBedivere'    },
    { internalName: 'Card_Cain_01',         cardName: 'Swordmaster',              charName: 'Cain'           },
    { internalName: 'Card_Claire_01',       cardName: 'Martial Arts Training',    charName: 'Claire'         },
    { internalName: 'Card_Belsey_01',       cardName: "Queen's Morning",          charName: 'Belsey'         },
    { internalName: 'Card_Cristina_01',     cardName: 'Rose Flame',               charName: 'Cristina'       },
    { internalName: 'Card_DianCecht_01',    cardName: 'Witch of Light',           charName: 'DianCecht'      },
    { internalName: 'Card_Elaine_01',       cardName: 'Water Spirit',             charName: 'Elaine'         },
    { internalName: 'Card_Elin_01',         cardName: 'Evasive Maneuver',         charName: 'Elin'           },
    { internalName: 'Card_Elizabeth_01',    cardName: 'Absolute Armor',           charName: 'Elizabeth'      },
    { internalName: 'Card_Enya_01',         cardName: "Manager's Dignity",        charName: 'Enya'           },
    { internalName: 'Card_Erin_01',         cardName: 'Princess of Smiles',       charName: 'Erin'           },
    { internalName: 'Card_Esmeralda_01',    cardName: 'Incarnation',              charName: 'Esmeralda'      },
    { internalName: 'Card_Estheria_01',     cardName: 'Quiet Temptation',         charName: 'Estheria'       },
    { internalName: 'Card_Ethan_01',        cardName: "Holy Sword's Blessing",    charName: 'Ethan'          },
    { internalName: 'Card_AbyssF30_01',     cardName: 'Holy Grail Spirit',        charName: 'Abyss F30'      },
    { internalName: 'Card_Eva_01',          cardName: 'Quenched at Last',         charName: 'Eva'            },
    { internalName: 'Card_Gaheris_01',      cardName: 'Knitting Master',          charName: 'Gaheris'        },
    { internalName: 'Card_Galahad_01',      cardName: 'Knight of Purity',         charName: 'Galahad'        },
    { internalName: 'Card_Gawain_01',       cardName: 'Green Belt',               charName: 'Gawain'         },
    { internalName: 'Card_Guinevere_01',    cardName: 'First Tactics',            charName: 'Guinevere'      },
    { internalName: 'Card_Hikage_01',       cardName: 'Mission Complete',         charName: 'Hikage'         },
    { internalName: 'Card_Isabel_01',       cardName: 'Titanomachia',             charName: 'Isabel'         },
    { internalName: 'Card_Isolde_01',       cardName: 'Art of Healing',           charName: 'Isolde'         },
    { internalName: 'Card_JoanOfArc_01',    cardName: 'Fighting Spirit',          charName: 'Joan Of Arc'    },
    { internalName: 'Card_Jessi_01',        cardName: 'Maintenance',              charName: 'Jessi'          },
    { internalName: 'Card_Ran_01',          cardName: 'Moonlight Swordplay',      charName: 'Ran'            },
    { internalName: 'Card_Karishara_01',    cardName: 'Exclusive to First Love',  charName: 'Karishara'      },
    { internalName: 'Card_Katrin_01',       cardName: 'Ice Empress',              charName: 'Katrin'         },
    { internalName: 'Card_Kay_01',          cardName: 'Flame Emperor',            charName: 'Kay'            },
    { internalName: 'Card_Circe_01',        cardName: 'Carpe Diem',               charName: 'Circe'          },
    { internalName: 'Card_Lancelot_01',     cardName: 'Clumsy Lover',             charName: 'Lancelot'       },
    { internalName: 'Card_Lilith_01',       cardName: 'Charm',                    charName: 'Lilith'         },
    { internalName: 'Card_Lisa_01',         cardName: 'Smile in the Dark',        charName: 'Lisa'           },
    { internalName: 'Card_Lohengrin_01',    cardName: 'Eternal Bond',             charName: 'Lohengrin'      },
    { internalName: 'Card_Lua_01',          cardName: 'Elgrad Sword Art Journal', charName: 'Lua'            },
    { internalName: 'Card_Lucius_01',       cardName: 'Lifelong Contract',        charName: 'Lucius'         },
    { internalName: 'Card_Lucy_01',         cardName: 'Sturdy Strength',          charName: 'Lucy'           },
    { internalName: 'Card_Lueira_01',       cardName: 'Sweet Afternoon',          charName: 'Lueira'         },
    { internalName: 'Card_Rowena_01',       cardName: 'Demon Pact',               charName: 'Rowena'         },
    { internalName: 'Card_AbyssF60_01',     cardName: "Red Dragon's Blessing",    charName: 'Abyss F60'      },
    { internalName: 'Card_Merlin_01',       cardName: "Water Dragon's Blessing",  charName: 'Merlin'         },
    { internalName: 'Card_SMerry_01',       cardName: 'Fiery Gaze',               charName: 'S. Merry'       },
    { internalName: 'Card_Mia_01',          cardName: 'Spill',                    charName: 'Mia'            },
    { internalName: 'Card_Mordred_01',      cardName: 'Eye of Vengeance',         charName: 'Mordred'        },
    { internalName: 'Card_Morgana_01',      cardName: 'Fairy Queen',              charName: 'Morgana'        },
    { internalName: 'Card_MorganLeFay_01',  cardName: "Queen's Temptation",       charName: 'Morgan Le Fay'  },
    { internalName: 'Card_Merry_01',        cardName: 'Reflex Nerves',            charName: 'Merry'          },
    { internalName: 'Card_Morgause_01',     cardName: 'Obedience',                charName: 'Morgause'       },
    { internalName: 'Card_Nesha_01',        cardName: 'Constricting Gaze',        charName: 'Nesha'          },
    { internalName: 'Card_Nimue_01',        cardName: "Spirit's Favor",           charName: 'Nimue'          },
    { internalName: 'Card_Palamedes_01',    cardName: "A Girl's Secrets",         charName: 'Palamedes'      },
    { internalName: 'Card_Percival_01',     cardName: 'Prydwen',                  charName: 'Percival'       },
    { internalName: 'Card_Rachel_01',       cardName: 'Eastern Medicine',         charName: 'Rachel'         },
    { internalName: 'Card_Ria_01',          cardName: 'Gourmet',                  charName: 'Ria'            },
    { internalName: 'Card_Rita_01',         cardName: 'Barista',                  charName: 'Rita'           },
    { internalName: 'Card_MaidRita_01',     cardName: 'Lovely Maid',              charName: 'Maid Rita'      },
    { internalName: 'Card_Sarah_01',        cardName: 'Glutton',                  charName: 'Sarah'          },
    { internalName: 'Card_Tiamat_01',       cardName: 'Doom Goddess',             charName: 'Tiamat'         },
    { internalName: 'Card_Tristan_01',      cardName: 'Unerring Bow',             charName: 'Tristan'        },
    { internalName: 'Card_Urien_01',        cardName: 'Magic Defense',            charName: 'Urien'          },
    { internalName: 'Card_Vivien_01',       cardName: 'Madness',                  charName: 'Vivien'         },
    { internalName: 'Card_Vortigern_01',    cardName: 'Absolute Monarchy',        charName: 'Abyss F90'      },
    { internalName: 'Card_Yumi_01',         cardName: 'Between Snowflakes',       charName: 'Yumi'           },
    { internalName: 'Card_Lumi_01',         cardName: 'Leadership',               charName: 'Lumi'           },
    { internalName: 'Card_Isis_01',         cardName: "Barbarian's Will",         charName: 'Isis'           },
    { internalName: 'Card_Ray_01',          cardName: 'Massacre',                 charName: 'Ray'            },
];

// ── Compatibility shims ───────────────────────────────────────────────────────
// The rest of the codebase reads rawCards and cardNames — these are derived
// from the unified CARDS array above so nothing else needs to change.

// rawCards: string array of 'Card_Name_01' values (what teamgrid.js maps over)
const rawCards = CARDS.map(c => c.internalName);

// cardNames: internal key → { cardName, charName }
// Key is the middle segment of the filename (e.g. 'Card_Anessa_01' → 'Anessa')
const cardNames = Object.fromEntries(
    CARDS.map(c => {
        const key = c.internalName.replace(/^Card_/, '').replace(/_\d+$/, '');
        return [key, { cardName: c.cardName, charName: c.charName }];
    })
);

// ── Helper: get card info from a stored card display name ─────────────────────

function getCardInfo(displayName) {
    if (!displayName) return null;
    if (cardNames[displayName]) return cardNames[displayName];
    const entry = Object.values(cardNames).find(
        c => c.cardName === displayName || c.charName === displayName
    );
    return entry || null;
}

// Build a lookup: cardName/charName → entry (for fast search)
const _cardNameIndex = {};
Object.values(cardNames).forEach(entry => {
    if (entry.cardName) _cardNameIndex[entry.cardName.toLowerCase()] = entry;
    if (entry.charName) _cardNameIndex[entry.charName.toLowerCase()] = entry;
});
