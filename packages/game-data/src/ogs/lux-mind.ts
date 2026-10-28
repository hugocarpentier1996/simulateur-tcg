import { defineUnit } from '../unit-definition.js';

/** OGS-006/024 : bonus déclenché au lancement d'un sort de coût 5+ énergie. */
export const luxMind = defineUnit({
  id: 'ogs-006-024',
  name: 'Lux',
  type: 'unit',
  cost: { energy: 6, power: { bleu: 1 } },
  might: 5,
  onExpensiveSpell: { minimumEnergy: 5, mightBonus: 3 },
  text: 'When you play a spell that costs {energy:5} or more, give me +3 {might} this turn.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/a0d10edf30abb6fde21f5d386e9a7db3c1b0a098-744x1039.png?accountingTag=RB',
});
