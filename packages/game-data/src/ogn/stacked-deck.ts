import { defineSpell } from '../spell-definition.js';
/** OGN-183 : Action ; regarde les 3 cartes du dessus de son deck, en met 1 en main et
 * recycle les autres. */
export const stackedDeck = defineSpell({
  id: 'ogn-183-298',
  name: 'Stacked Deck',
  type: 'spell',
  timing: 'action',
  cost: { energy: 1, power: {} },
  target: { kind: 'caster' },
  effects: [{ type: 'look-pick', count: 3 }],
  text: '[Action] (Play on your turn or in showdowns.)\nLook at the top 3 cards of your Main Deck. Put 1 into your hand and recycle the rest.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/fdcb22cb620a4c1c37920d6b744edb615647cbd4-744x1039.png?accountingTag=RB',
});
