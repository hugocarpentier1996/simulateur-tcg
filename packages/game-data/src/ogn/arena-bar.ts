import { defineGear } from '../gear-definition.js';
/** OGN-124 : Tap — buffe une unité alliée Tap. */
export const arenaBar = defineGear({
  id: 'ogn-124-298',
  name: 'Arena Bar',
  type: 'gear',
  cost: { energy: 3, power: {} },
  effects: [],
  tapAbility: {
    target: { allegiance: 'friendly', exhausted: true },
    effect: { type: 'buff' },
  },
  text: "{exhaust}: Buff an exhausted friendly unit. (If it doesn't have a buff, it gets a +1 {might} buff.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/519306d1d4a36f2d54fe0982268a197a257f5e5d-744x1039.png?accountingTag=RB',
});
