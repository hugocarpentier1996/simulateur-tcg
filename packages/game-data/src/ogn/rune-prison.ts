import { defineSpell } from '../spell-definition.js';
/** OGN-050 : étourdit une unité quelconque (aucun dégât de combat) jusqu'à la fin du tour. */
export const runePrison = defineSpell({
  id: 'ogn-050-298',
  name: 'Rune Prison',
  type: 'spell',
  timing: 'action',
  cost: { energy: 2, power: { vert: 1 } },
  target: { kind: 'unit', combatRole: 'any' },
  effects: [{ type: 'stun', duration: 'end-of-turn' }],
  text: "[Action] (Play on your turn or in showdowns.)\nStun a unit. (It doesn't deal combat damage this turn.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/21867baeaced3c22cda5f40f6b6c9a8dad4b7042-744x1039.png?accountingTag=RB',
});
