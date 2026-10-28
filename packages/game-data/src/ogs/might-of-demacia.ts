import { defineLegend } from '../legend-definition.js';
export const mightOfDemacia = defineLegend({
  id: 'ogs-023-024',
  name: 'Might of Demacia',
  type: 'legend',
  colors: ['orange', 'jaune'],
  text: 'When you conquer, if you have 4+ units at that battlefield, draw 2.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/e7185deb46f17770802d06aeddfe3b929afff880-744x1039.png?accountingTag=RB',
  conquestDraw: { minimumUnits: 4, count: 2 },
});
