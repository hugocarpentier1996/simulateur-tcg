import { defineSpell } from '../spell-definition.js';
/** OGN-248 : six instructions « inflige 2 à une unité », cibles choisies au lancement (la
 * même unité peut être choisie plusieurs fois) ; 3 Power répartis au choix Fury/Mind. */
export const icathianRain = defineSpell({
  id: 'ogn-248-298',
  name: 'Icathian Rain',
  type: 'spell',
  timing: 'normal',
  cost: {
    energy: 7,
    power: {},
    powerChoice: ['rouge', 'bleu'],
    powerChoiceAmount: 3,
  },
  target: { kind: 'caster' },
  effects: [{ type: 'damage-instances', count: 6, amount: 2 }],
  text: 'Deal 2 to a unit.\nDeal 2 to a unit.\nDeal 2 to a unit.\nDeal 2 to a unit.\nDeal 2 to a unit.\nDeal 2 to a unit.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/8df37f633d3da734f3f2d85808a7cb9eadec1b04-744x1039.png?accountingTag=RB',
});
