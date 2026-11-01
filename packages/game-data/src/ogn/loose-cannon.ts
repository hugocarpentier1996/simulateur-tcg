import { defineLegend } from '../legend-definition.js';
/** OGN-251 : au début de sa Beginning, pioche 1 s'il a 1 carte ou moins en main. */
export const looseCannon = defineLegend({
  id: 'ogn-251-298',
  name: 'Loose Cannon',
  type: 'legend',
  colors: ['rouge', 'violet'],
  beginningDrawIfHandAtMost: 1,
  text: 'At start of your Beginning Phase, draw 1 if you have one or fewer cards in your hand.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/f57c14381b126e9f5a7b5bc4913151cb24c14fc3-744x1039.png?accountingTag=RB',
});
