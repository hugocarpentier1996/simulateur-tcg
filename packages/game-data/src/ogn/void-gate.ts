import { defineBattlefield } from '../battlefield-definition.js';
export const voidGate = defineBattlefield({
  id: 'ogn-296-298',
  name: 'Void Gate',
  text: 'Spells and abilities affecting units here each deal 1 Bonus Damage. (Each instance of damage the spell deals is increased by 1.)',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/14a52a367fd41fd84745e050e62d1f281f733467-1038x744.png?accountingTag=RB',
  type: 'battlefield',
  effectDamageBonus: 1,
});
