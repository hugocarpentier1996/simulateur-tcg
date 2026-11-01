import { defineUnit } from '../unit-definition.js';
/** OGN-070 : sur un champ, les adversaires ne peuvent jouer leurs unités qu'en base, et les
 * sorts et capacités ne peuvent pas redresser les unités ennemies. */
export const mageseekerWarden = defineUnit({
  id: 'ogn-070-298',
  name: 'Mageseeker Warden',
  type: 'unit',
  cost: { energy: 6, power: { vert: 1 } },
  might: 5,
  wardenLockdown: true,
  text: "While I'm at a battlefield, opponents can only play units to their base.\nWhile I'm at a battlefield, spells and abilities can't ready enemy units and gear.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/ae844b929f817cdf76fe40c7bf5d5fc02062bdac-744x1039.png?accountingTag=RB',
});
