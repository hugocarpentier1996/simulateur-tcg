import { defineUnit } from '../unit-definition.js';
export const maddenedMarauder = defineUnit({
  id: 'ogn-191-298',
  name: 'Maddened Marauder',
  text: '[Tank] (I must be assigned combat damage first.)\nWhen you play me, move a unit from a battlefield to its base.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/0f3a2ab8e5894e0dd1b625ee29f3304e7832ef9a-744x1039.png?accountingTag=RB',
  type: 'unit',
  might: 4,
  cost: { energy: 5, power: {} },
  tank: true,
  onPlayMoveToBase: true,
});
