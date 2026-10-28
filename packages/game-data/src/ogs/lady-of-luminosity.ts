import { defineLegend } from '../legend-definition.js';
export const ladyOfLuminosity = defineLegend({
  id: 'ogs-021-024',
  name: 'Lady of Luminosity',
  type: 'legend',
  colors: ['bleu', 'jaune'],
  text: 'When you play a spell that costs {energy:5} or more, draw 1.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/44885d811b70621b188d9813b2b10b5cff1b81e6-744x1039.png?accountingTag=RB',
  spellDraw: { minimumEnergy: 5, count: 1 },
});
