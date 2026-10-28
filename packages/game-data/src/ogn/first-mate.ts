import { defineUnit } from '../unit-definition.js';
export const firstMate = defineUnit({
  id: 'ogn-132-298',
  name: 'First Mate',
  text: 'When you play me, ready another unit.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/85e2b436ea482d53563cc5fa955f2a867ee6c32f-744x1039.png?accountingTag=RB',
  type: 'unit',
  might: 3,
  cost: { energy: 3, power: {} },
  onPlayReadyOther: true,
});
