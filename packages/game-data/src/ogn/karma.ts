import { defineUnit } from '../unit-definition.js';
/** OGN-235 : Vision ; quand son propriétaire recycle une ou plusieurs cartes, une unité
 * alliée est buffée (sans buff d'abord, hypothèse ; sans pile). */
export const karma = defineUnit({
  id: 'ogn-235-298',
  name: 'Karma',
  type: 'unit',
  might: 6,
  cost: { energy: 6, power: { jaune: 1 } },
  onPlayVision: true,
  buffOnRecycle: true,
  text: "[Vision] (When you play me, look at the top card of your Main Deck. You may recycle it.)\nWhen you recycle one or more cards, buff a friendly unit. (If it doesn't have a buff, it gets a +1 {might} buff. Runes aren't cards.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/aca8664b334f2fa40cc7bae2811dd4e1b4f06388-744x1039.png?accountingTag=RB',
});
