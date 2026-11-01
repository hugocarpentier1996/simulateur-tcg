import { defineGear } from '../gear-definition.js';
/** OGN-090 : Tap — une unité a -1 Might ce tour, minimum 1. */
export const orbOfRegret = defineGear({
  id: 'ogn-090-298',
  name: 'Orb of Regret',
  type: 'gear',
  cost: { energy: 1, power: {} },
  effects: [],
  tapAbility: {
    target: {},
    effect: { type: 'modify-might', amount: -1, minimum: 1 },
  },
  text: '{exhaust}: Give a unit -1 {might} this turn, to a minimum of 1 {might}.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/fd883b646d1a3cdb1a03b0c19dc62c92ca552f4f-744x1039.png?accountingTag=RB',
});
