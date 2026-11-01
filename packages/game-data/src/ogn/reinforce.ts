import { defineSpell } from '../spell-definition.js';
/** OGN-062 : regarde les 5 cartes du dessus ; peut jouer une unité parmi elles avec 5 énergie
 * de moins (reste du coût payé automatiquement, hypothèse) ; recycle les autres. */
export const reinforce = defineSpell({
  id: 'ogn-062-298',
  name: 'Reinforce',
  type: 'spell',
  timing: 'normal',
  cost: { energy: 5, power: {} },
  target: { kind: 'caster' },
  effects: [{ type: 'look-play-unit', count: 5, energyReduction: 5 }],
  text: 'Look at the top 5 cards of your Main Deck. You may banish a unit from among them, then play it, reducing its cost by {energy:5}. Recycle the remaining cards.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/5bb4ce960c7636dac103c560a2e2f4e32f9d5390-744x1039.png?accountingTag=RB',
});
