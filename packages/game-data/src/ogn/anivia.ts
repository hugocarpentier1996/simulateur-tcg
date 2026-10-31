import { defineUnit } from '../unit-definition.js';
/** OGN-148 : en attaquant, 3 dégâts à toutes les unités ennemies de ce champ. */
export const anivia = defineUnit({
  id: 'ogn-148-298',
  name: 'Anivia',
  type: 'unit',
  cost: { energy: 7, power: { orange: 2 } },
  might: 8,
  onAttackDamageEnemiesHere: 3,
  text: 'When I attack, deal 3 to all enemy units here.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/ca1a56035333e31b3a04d67ee9131bb4d533e5db-744x1039.png?accountingTag=RB',
});
