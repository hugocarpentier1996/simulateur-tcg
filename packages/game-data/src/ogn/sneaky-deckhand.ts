import { defineUnit } from '../unit-definition.js';
export const sneakyDeckhand = defineUnit({
  id: 'ogn-176-298',
  name: 'Sneaky Deckhand',
  text: 'You may play me to an open battlefield.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/6f95b6aac293d8e477192281df47d8466da502bf-744x1039.png?accountingTag=RB',
  type: 'unit',
  might: 2,
  cost: { energy: 3, power: {} },
  canPlayToOpenBattlefield: true,
});
