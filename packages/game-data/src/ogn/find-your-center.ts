import { defineSpell } from '../spell-definition.js';
/** OGN-047 : Action ; -2 énergie si un adversaire est à 3 points ou moins de la victoire.
 * Pioche 1 puis canalise 1 rune Tap. */
export const findYourCenter = defineSpell({
  id: 'ogn-047-298',
  name: 'Find Your Center',
  type: 'spell',
  timing: 'action',
  cost: { energy: 3, power: {} },
  costReduction: { kind: 'opponent-near-victory', within: 3, energy: 2 },
  target: { kind: 'caster' },
  effects: [
    { type: 'draw', count: 1, player: 'caster' },
    { type: 'channel-exhausted', count: 1 },
  ],
  text: "[Action] (Play on your turn or in showdowns.)\nIf an opponent's score is within 3 points of the Victory Score, this costs {energy:2} less.\nDraw 1 and channel 1 rune exhausted.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/cd9d798b496fdce133c5b0106d636a230b6e7ebe-744x1039.png?accountingTag=RB',
});
