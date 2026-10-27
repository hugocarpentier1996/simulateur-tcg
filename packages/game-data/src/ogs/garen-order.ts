import { defineUnit } from '../unit-definition.js';

/** OGS-013/024 — version Order, distincte de Garen Body. */
export const garenOrder = defineUnit({
  id: 'ogs-013-024',
  name: 'Garen',
  type: 'unit',
  cost: { energy: 6, power: { jaune: 1 } },
  might: 5,
  otherAlliesHereMightBonus: 1,
  text: 'Other friendly units have +1 {might} here.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/cbf2c12d69a86566e4cda07050b2d4495e40187e-744x1039.png?accountingTag=RB',
});
