import { defineUnit } from '../unit-definition.js';
/** OGN-067 : Tank ; joué sur un champ, peut y déplacer une unité ennemie ; quand il tient,
 * retourne dans la main de son propriétaire. */
export const blitzcrank = defineUnit({
  id: 'ogn-067-298',
  name: 'Blitzcrank',
  type: 'unit',
  cost: { energy: 5, power: { vert: 1 } },
  might: 5,
  tank: true,
  onPlayTargetEffect: {
    allegiance: 'enemy',
    optional: true,
    onlyToBattlefield: true,
    effect: { type: 'pull-here' },
  },
  onHoldReturnToHand: true,
  text: "[Tank] (I must be assigned combat damage first.)\nWhen you play me to a battlefield, you may move an enemy unit to here.\nWhen I hold, return me to my owner's hand.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/654dcc4aef0a0b5a0c6e928d7aae397a52c3ab17-744x1039.png?accountingTag=RB',
});
