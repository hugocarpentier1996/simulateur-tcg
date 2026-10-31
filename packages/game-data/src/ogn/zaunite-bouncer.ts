import { defineUnit } from '../unit-definition.js';
/** OGN-188 : à la mise en jeu, renvoie une autre unité sur un champ dans la main de son propriétaire. */
export const zauniteBouncer = defineUnit({
  id: 'ogn-188-298',
  name: 'Zaunite Bouncer',
  type: 'unit',
  cost: { energy: 4, power: { violet: 2 } },
  might: 2,
  onPlayTargetEffect: {
    zone: 'battlefield',
    excludeSelf: true,
    effect: { type: 'return-to-hand' },
  },
  text: "When you play me, return another unit at a battlefield to its owner's hand.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/0f4e8258e3920e4a4654cfe74faf8c266f2aa5dd-744x1039.png?accountingTag=RB',
});
