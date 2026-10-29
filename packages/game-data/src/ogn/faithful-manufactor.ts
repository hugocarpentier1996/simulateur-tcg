import { defineUnit } from '../unit-definition.js';
export const faithfulManufactor = defineUnit({
  id: 'ogn-211-298',
  name: 'Faithful Manufactor',
  text: 'When you play me, play a 1 {might} Recruit unit token here.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/b41107b7456a2a38d203983b1e504e3789d6b6ea-744x1039.png?accountingTag=RB',
  type: 'unit',
  might: 2,
  cost: { energy: 3, power: {} },
  onPlaySummonHere: 'ogs-recruit-token',
});
