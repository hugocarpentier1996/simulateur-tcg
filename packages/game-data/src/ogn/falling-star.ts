import { defineSpell } from '../spell-definition.js';
/** OGN-029 : deux instructions « inflige 3 à une unité », chacune avec sa cible (éventuellement la même). */
export const fallingStar = defineSpell({
  id: 'ogn-029-298',
  name: 'Falling Star',
  type: 'spell',
  timing: 'normal',
  cost: { energy: 2, power: { rouge: 2 } },
  target: { kind: 'caster' },
  effects: [{ type: 'damage-instances', count: 2, amount: 3 }],
  text: 'Deal 3 to a unit.\nDeal 3 to a unit.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/9cf2d2e59e1bf839cdf5c2a77e95f5d1e871788f-744x1039.png?accountingTag=RB',
});
