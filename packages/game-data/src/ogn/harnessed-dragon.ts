import { defineUnit } from '../unit-definition.js';
/** OGN-234 : à la mise en jeu, tue une unité ennemie. */
export const harnessedDragon = defineUnit({
  id: 'ogn-234-298',
  name: 'Harnessed Dragon',
  type: 'unit',
  cost: { energy: 8, power: { jaune: 2 } },
  might: 6,
  onPlayTargetEffect: { allegiance: 'enemy', effect: { type: 'kill' } },
  text: 'When you play me, kill an enemy unit.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/00bc15bc1c2f5b8e6d1713819998df1c04864dcb-744x1039.png?accountingTag=RB',
});
