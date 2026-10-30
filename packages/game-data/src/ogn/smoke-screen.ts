import { defineSpell } from '../spell-definition.js';
/** OGN-093 : Réaction ; -4 Might jusqu'à la fin du tour, sans descendre sous 1. */
export const smokeScreen = defineSpell({
  id: 'ogn-093-298',
  name: 'Smoke Screen',
  type: 'spell',
  timing: 'reaction',
  cost: { energy: 2, power: { bleu: 1 } },
  target: { kind: 'unit', combatRole: 'any' },
  effects: [
    { type: 'modify-might', amount: -4, minimum: 1, duration: 'end-of-turn' },
  ],
  text: '[Reaction] (Play any time, even before spells and abilities resolve.)\nGive a unit -4 {might} this turn, to a minimum of 1 {might}.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/06c34457afd09b828ee0b2862ed51eb31004d888-744x1039.png?accountingTag=RB',
});
