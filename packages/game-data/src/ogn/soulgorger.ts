import { defineUnit } from '../unit-definition.js';
/** OGN-196 : à la mise en jeu, peut jouer une unité de son cimetière sans son coût en
 * énergie (son Power est payé avec Soulgorger, hypothèse). */
export const soulgorger = defineUnit({
  id: 'ogn-196-298',
  name: 'Soulgorger',
  type: 'unit',
  might: 5,
  cost: { energy: 8, power: { violet: 2 } },
  onPlayFromTrash: { payPower: true },
  text: 'When you play me, you may play a unit from your trash, ignoring its Energy cost. (You must still pay its Power cost.)',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/439c4fa7c8c47cba41df8bce3fe3c8068d297382-744x1039.png?accountingTag=RB',
});
