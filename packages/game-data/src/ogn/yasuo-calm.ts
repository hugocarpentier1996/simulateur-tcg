import { defineUnit } from '../unit-definition.js';
/** OGN-076 : en attaquant, dégâts égaux à sa Might à une unité ennemie de ce champ. */
export const yasuoCalm = defineUnit({
  id: 'ogn-076-298',
  name: 'Yasuo',
  type: 'unit',
  cost: { energy: 6, power: { vert: 2 } },
  might: 6,
  onAttackTargetEffect: { type: 'might-damage' },
  text: 'When I attack, deal damage equal to my Might to an enemy unit here.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/1643a6c93626884c93363557e1a483642bda6c45-744x1039.png?accountingTag=RB',
});
