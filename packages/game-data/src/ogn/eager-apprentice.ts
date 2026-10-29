import { defineUnit } from '../unit-definition.js';
export const eagerApprentice = defineUnit({
  id: 'ogn-084-298',
  name: 'Eager Apprentice',
  text: "While I'm at a battlefield, the Energy costs for spells you play is reduced by {energy:1}, to a minimum of {energy:1}.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/cf6d5447ff3634d8c2c0216cb2e5802fb5ca0b2e-744x1039.png?accountingTag=RB',
  type: 'unit',
  might: 3,
  cost: { energy: 3, power: {} },
  spellEnergyReductionAtBattlefield: 1,
});
