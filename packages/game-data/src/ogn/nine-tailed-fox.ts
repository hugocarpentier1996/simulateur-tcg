import { defineLegend } from '../legend-definition.js';
/** OGN-255 : quand une unité ennemie attaque un champ qu'il contrôle, elle a -1 Might ce
 * tour, minimum 1. */
export const nineTailedFox = defineLegend({
  id: 'ogn-255-298',
  name: 'Nine-Tailed Fox',
  type: 'legend',
  colors: ['vert', 'bleu'],
  weakenAttackers: 1,
  text: 'When an enemy unit attacks a battlefield you control, give it -1 {might} this turn, to a minimum of 1 {might}.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/56457c7986d3f140b7123a988149cc30a83493a7-744x1039.png?accountingTag=RB',
});
