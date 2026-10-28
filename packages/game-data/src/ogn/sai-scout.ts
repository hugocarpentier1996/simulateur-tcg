import { defineUnit } from '../unit-definition.js';
export const saiScout = defineUnit({
  id: 'ogn-174-298',
  name: 'Sai Scout',
  text: '[Vision] (When you play me, look at the top card of your Main Deck. You may recycle it.)\nYou may play me to an open battlefield.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/eab1fc8c95931519319c4c80681a261d75214c48-744x1039.png?accountingTag=RB',
  type: 'unit',
  might: 5,
  cost: { energy: 6, power: {} },
  onPlayVision: true,
  canPlayToOpenBattlefield: true,
});
