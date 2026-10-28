import { defineUnit } from '../unit-definition.js';
export const daringPoro = defineUnit({
  id: 'ogn-210-298',
  name: 'Daring Poro',
  type: 'unit',
  cost: { energy: 2, power: {} },
  might: 2,
  text: "[Assault] (+1 {might} while I'm an attacker.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/41dee7ec46124c261352595cfbd8a6d38d32b947-744x1039.png?accountingTag=RB',
  assault: 1,
});
