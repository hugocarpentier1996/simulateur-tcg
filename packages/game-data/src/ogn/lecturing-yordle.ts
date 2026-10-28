import { defineUnit } from '../unit-definition.js';
export const lecturingYordle = defineUnit({
  id: 'ogn-087-298',
  name: 'Lecturing Yordle',
  text: '[Tank] (I must be assigned combat damage first.)\nWhen you play me, draw 1.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/62e22370dac35c18de21efbfce9c86ca821e9105-744x1039.png?accountingTag=RB',
  type: 'unit',
  might: 2,
  cost: { energy: 3, power: {} },
  tank: true,
  onPlayEffect: { type: 'draw', count: 1 },
});
