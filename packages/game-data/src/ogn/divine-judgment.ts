import { defineSpell } from '../spell-definition.js';
/** OGN-244 : chaque joueur garde 2 unités, 2 gears, 2 runes et 2 cartes en main ; tout le
 * reste est recyclé (choix successifs, le lanceur d'abord). */
export const divineJudgment = defineSpell({
  id: 'ogn-244-298',
  name: 'Divine Judgment',
  type: 'spell',
  timing: 'normal',
  cost: { energy: 7, power: { jaune: 2 } },
  target: { kind: 'caster' },
  effects: [{ type: 'divine-judgment' }],
  text: 'Each player chooses 2 units, 2 gear, 2 runes, and 2 cards in their hands. Recycle the rest.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/995778eea2e24fdc62ade38c2baa25b9f1e6ab79-744x1039.png?accountingTag=RB',
});
