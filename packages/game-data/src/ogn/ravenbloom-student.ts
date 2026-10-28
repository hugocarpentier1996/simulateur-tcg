import { defineUnit } from '../unit-definition.js';
/** Réutilise le déclenchement de Lux avec seuil zéro : chaque sort, même gratuit. */
export const ravenbloomStudent = defineUnit({
  id: 'ogn-103-298',
  name: 'Ravenbloom Student',
  type: 'unit',
  cost: { energy: 2, power: {} },
  might: 2,
  onExpensiveSpell: { minimumEnergy: 0, mightBonus: 1 },
  text: 'When you play a spell, give me +1 {might} this turn.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/b98b1ff793b6eb263957258742cc83d50fda6537-744x1039.png?accountingTag=RB',
});
