import { defineUnit } from '../unit-definition.js';
export const mysticPoro = defineUnit({
  id: 'ogn-171-298',
  name: 'Mystic Poro',
  text: '[Vision] (When you play me, look at the top card of your Main Deck. You may recycle it.)',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/11af57d045768e886d05e1c0933b0d57cb1e459d-744x1039.png?accountingTag=RB',
  type: 'unit',
  might: 2,
  cost: { energy: 2, power: {} },
  onPlayVision: true,
});
