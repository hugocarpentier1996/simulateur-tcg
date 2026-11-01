import { defineGear } from '../gear-definition.js';
/** OGN-184 : 1 énergie, Tap — déplace une unité alliée d'un champ vers sa base. */
export const theSyren = defineGear({
  id: 'ogn-184-298',
  name: 'The Syren',
  type: 'gear',
  cost: { energy: 2, power: {} },
  effects: [],
  tapAbility: {
    cost: { energy: 1, power: {} },
    target: { allegiance: 'friendly', zone: 'battlefield' },
    effect: { type: 'move-to-base' },
  },
  text: '{energy:1}, {exhaust}: Move a friendly unit at a battlefield to your base.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/cafdd212b542243e10e5fac587616ab77e3d9cf1-744x1039.png?accountingTag=RB',
});
