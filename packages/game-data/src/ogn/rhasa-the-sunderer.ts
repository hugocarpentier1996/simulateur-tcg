import { defineUnit } from '../unit-definition.js';
/** OGN-195 : coûte 1 énergie de moins par carte du cimetière de son propriétaire. */
export const rhasaTheSunderer = defineUnit({
  id: 'ogn-195-298',
  name: 'Rhasa the Sunderer',
  type: 'unit',
  cost: { energy: 10, power: { violet: 1 } },
  might: 6,
  energyReductionPerTrashCard: 1,
  text: 'I cost {energy:1} less for each card in your trash.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/e34fe8a9ee533dee99f96b4e6677d1edbd6a262d-744x1039.png?accountingTag=RB',
});
