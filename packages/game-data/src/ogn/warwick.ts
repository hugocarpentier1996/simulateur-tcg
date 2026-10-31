import { defineUnit } from '../unit-definition.js';
/** OGN-159 : arrive Ready ; en attaquant, tue toutes les unités ennemies blessées du champ. */
export const warwick = defineUnit({
  id: 'ogn-159-298',
  name: 'Warwick',
  type: 'unit',
  cost: { energy: 6, power: { orange: 1 } },
  might: 5,
  entersReady: true,
  onAttackKillDamagedEnemiesHere: true,
  text: 'I enter ready.\nWhen I attack, kill all damaged enemy units here.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/fcbf878905001fa81858e9f081346fd05425f264-744x1039.png?accountingTag=RB',
});
