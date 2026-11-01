import { defineUnit } from '../unit-definition.js';
/** OGN-167 : quand son propriétaire joue une carte depuis Hidden, +2 Might ce tour. */
export const emberMonk = defineUnit({
  id: 'ogn-167-298',
  name: 'Ember Monk',
  type: 'unit',
  might: 4,
  cost: { energy: 4, power: {} },
  mightOnHiddenPlay: 2,
  text: 'When you play a card from [Hidden], give me +2 {might} this turn.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/0441f70a7acc377d8cbe08559b7a2fc3139c903b-744x1039.png?accountingTag=RB',
});
