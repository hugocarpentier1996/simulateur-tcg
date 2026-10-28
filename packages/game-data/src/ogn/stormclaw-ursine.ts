import { defineUnit } from '../unit-definition.js';
export const stormclawUrsine = defineUnit({
  id: 'ogn-137-298',
  name: 'Stormclaw Ursine',
  text: '[Tank] (I must be assigned combat damage first.)\nWhen you play me, channel 1 rune exhausted.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/137e5a1faec1c8b26a5a0abc7802f6461cc725c8-744x1039.png?accountingTag=RB',
  type: 'unit',
  might: 6,
  cost: { energy: 7, power: {} },
  tank: true,
  onPlayEffect: { type: 'channel-exhausted', count: 1 },
});
