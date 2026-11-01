import { defineSpell } from '../spell-definition.js';
/** OGN-071 : l'adversaire choisit Cartes (chacun pioche 1) ou Runes (chacun canalise 1 rune Tap). */
export const partyFavors = defineSpell({
  id: 'ogn-071-298',
  name: 'Party Favors',
  type: 'spell',
  timing: 'normal',
  cost: { energy: 3, power: {} },
  target: { kind: 'caster' },
  effects: [{ type: 'party-favors' }],
  text: 'Each other player chooses Cards or Runes. For each player that chooses Cards, you and that player each draw 1. For each player that chooses Runes, you and that player each channel 1 rune exhausted.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/fddcef3c55663c5d6856f6d039d19cacfd64abb5-744x1039.png?accountingTag=RB',
});
