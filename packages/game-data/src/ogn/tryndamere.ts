import { defineUnit } from '../unit-definition.js';
/** OGN-034 : quand il conquiert après une attaque où son propriétaire a assigné 5 dégâts
 * excédentaires ou plus aux unités ennemies, son propriétaire marque 1 point. */
export const tryndamere = defineUnit({
  id: 'ogn-034-298',
  name: 'Tryndamere',
  type: 'unit',
  might: 8,
  cost: { energy: 7, power: { rouge: 2 } },
  conquerExcessScore: 5,
  text: 'When I conquer after an attack, if you assigned 5 or more excess damage to enemy units, you score 1 point.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/124c93495c927be1baea03fdacf6c7b283cf8b6c-744x1039.png?accountingTag=RB',
});
