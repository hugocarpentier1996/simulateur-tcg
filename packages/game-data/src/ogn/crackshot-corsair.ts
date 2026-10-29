import { defineUnit } from '../unit-definition.js';
export const crackshotCorsair = defineUnit({
  id: 'ogn-130-298',
  name: 'Crackshot Corsair',
  text: 'When I attack, deal 1 to an enemy unit here.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/9106ab084e02d7a489cb351e98112e5833b0bb11-744x1039.png?accountingTag=RB',
  type: 'unit',
  might: 3,
  cost: { energy: 3, power: {} },
  onAttackDamage: 1,
});
