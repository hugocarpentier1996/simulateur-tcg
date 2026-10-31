import { defineUnit } from '../unit-definition.js';
/** OGN-092 : à la mise en jeu, 6 dégâts à une unité ennemie sur un champ. */
export const riptideRex = defineUnit({
  id: 'ogn-092-298',
  name: 'Riptide Rex',
  type: 'unit',
  cost: { energy: 6, power: { bleu: 2 } },
  might: 6,
  onPlayTargetEffect: {
    allegiance: 'enemy',
    zone: 'battlefield',
    effect: { type: 'damage', amount: 6 },
  },
  text: 'When you play me, deal 6 to an enemy unit at a battlefield.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/e09bf1fb6d72da31d415ea31ae7413fe7f02d650-744x1039.png?accountingTag=RB',
});
