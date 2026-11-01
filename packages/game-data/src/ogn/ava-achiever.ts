import { defineUnit } from '../unit-definition.js';
/** OGN-107 : en attaquant, peut payer 1 Power Mind pour jouer ici, gratuitement, une unité
 * Hidden de sa main (les gears vont en base ; sorts non gérés, hypothèse). */
export const avaAchiever = defineUnit({
  id: 'ogn-107-298',
  name: 'Ava Achiever',
  type: 'unit',
  might: 4,
  cost: { energy: 5, power: {} },
  onAttackPlayHidden: { power: 'bleu' },
  text: 'When I attack, you may pay {power:mind} to play a card with [Hidden] from your hand here, ignoring its cost.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/93e91aa99eb09baa68dd95b0013a89d9ffde5240-744x1039.png?accountingTag=RB',
});
