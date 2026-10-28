import { defineUnit } from '../unit-definition.js';
export const travelingMerchant = defineUnit({
  id: 'ogn-185-298',
  name: 'Traveling Merchant',
  text: 'When I move, discard 1, then draw 1.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/b7dbebe2bf5691391c8e4146e478b8bd2ac40aef-744x1039.png?accountingTag=RB',
  type: 'unit',
  might: 2,
  cost: { energy: 2, power: {} },
  onMoveLoot: true,
});
