import { defineUnit } from '../unit-definition.js';
/** OGN-161 : Deflect ; peut être joué sur un champ occupé par des unités ennemies. */
export const deadbloomPredator = defineUnit({
  id: 'ogn-161-298',
  name: 'Deadbloom Predator',
  type: 'unit',
  cost: { energy: 8, power: { orange: 2 } },
  might: 8,
  deflect: true,
  canPlayToOccupiedEnemyBattlefield: true,
  text: '[Deflect] (Opponents must pay {power:any} to choose me with a spell or ability.)\nYou may play me to an occupied enemy battlefield.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/112b4b3847b26ea2d245ac0976717d109be7b032-744x1039.png?accountingTag=RB',
});
