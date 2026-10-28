import { defineUnit } from '../unit-definition.js';
export const duneDrake = defineUnit({
  id: 'ogn-131-298',
  name: 'Dune Drake',
  text: 'When I attack, give me +2 {might} this turn if there is a ready enemy unit here.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/ba18bf4a5fa9777a0cb5ae69cc7e6f049bbceaa0-744x1039.png?accountingTag=RB',
  type: 'unit',
  might: 5,
  cost: { energy: 5, power: {} },
  onAttackReadyEnemyMightBonus: 2,
});
