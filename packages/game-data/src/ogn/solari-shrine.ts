import { defineGear } from '../gear-definition.js';
/** OGN-072 : quand son propriétaire tue une unité ennemie Stun, il peut coucher ce gear pour
 * piocher 1 (accepté automatiquement s'il est Ready, sans pile). */
export const solariShrine = defineGear({
  id: 'ogn-072-298',
  name: 'Solari Shrine',
  type: 'gear',
  cost: { energy: 3, power: {} },
  effects: [],
  drawOnStunnedEnemyKill: true,
  text: 'When you kill a stunned enemy unit, you may exhaust this to draw 1.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/139a6d1c62a717bab4cdd75926e7f4aba6efb15d-744x1039.png?accountingTag=RB',
});
