import { defineUnit } from '../unit-definition.js';
export const poutyPoro = defineUnit({
  id: 'ogn-013-298',
  name: 'Pouty Poro',
  text: '[Deflect] (Opponents must pay {power:any} to choose me with a spell or ability.)',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/d541bf3bcb5aa3ad0d48d87f5753569b72ac426f-744x1039.png?accountingTag=RB',
  type: 'unit',
  might: 2,
  cost: { energy: 2, power: {} },
  deflect: true,
});
