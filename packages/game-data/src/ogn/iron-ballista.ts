import { defineGear } from '../gear-definition.js';
/** OGN-017 : entre Tap ; Tap : 2 dégâts à une unité sur un champ. */
export const ironBallista = defineGear({
  id: 'ogn-017-298',
  name: 'Iron Ballista',
  type: 'gear',
  cost: { energy: 3, power: {} },
  effects: [],
  entersExhausted: true,
  tapAbility: {
    target: { zone: 'battlefield' },
    effect: { type: 'damage', amount: 2 },
  },
  text: 'This enters exhausted.\n{exhaust}: Deal 2 to a unit at a battlefield.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/9b5cfe757b6067994e17e284eba46433880a1461-744x1039.png?accountingTag=RB',
});
