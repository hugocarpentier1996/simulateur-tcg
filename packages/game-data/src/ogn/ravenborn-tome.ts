import { defineGear } from '../gear-definition.js';
/** OGN-032 : Tap — le prochain sort joué ce tour inflige 1 dégât bonus par instance. */
export const ravenbornTome = defineGear({
  id: 'ogn-032-298',
  name: 'Ravenborn Tome',
  type: 'gear',
  cost: { energy: 3, power: {} },
  effects: [],
  tapAbility: {
    target: {},
    effect: { type: 'next-spell-bonus-damage', amount: 1 },
  },
  text: '{exhaust}: The next spell you play this turn deals 1 Bonus Damage. (Each instance of damage the spell deals is increased by 1.)',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/81f968126026635e5b9a2fa1048fc979fcd13a1d-744x1039.png?accountingTag=RB',
});
