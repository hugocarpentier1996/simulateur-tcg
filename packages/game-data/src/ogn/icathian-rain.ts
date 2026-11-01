import { defineSpell } from '../spell-definition.js';
/** OGN-248 : six instructions « inflige 2 à une unité » (cibles choisies une à une à la
 * résolution, hypothèse). */
export const icathianRain = defineSpell({
  id: 'ogn-248-298',
  name: 'Icathian Rain',
  type: 'spell',
  timing: 'normal',
  cost: { energy: 7, power: { rouge: 2, bleu: 1 } },
  target: { kind: 'caster' },
  effects: [{ type: 'damage-hits', count: 6, amount: 2 }],
  text: 'Deal 2 to a unit.\nDeal 2 to a unit.\nDeal 2 to a unit.\nDeal 2 to a unit.\nDeal 2 to a unit.\nDeal 2 to a unit.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/8df37f633d3da734f3f2d85808a7cb9eadec1b04-744x1039.png?accountingTag=RB',
});
