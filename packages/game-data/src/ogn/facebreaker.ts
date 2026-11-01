import { defineSpell } from '../spell-definition.js';
/** OGN-220 : Hidden ; Action ; étourdit une unité alliée et une unité ennemie du même champ. */
export const facebreaker = defineSpell({
  id: 'ogn-220-298',
  name: 'Facebreaker',
  type: 'spell',
  timing: 'action',
  hidden: true,
  cost: { energy: 2, power: {} },
  target: {
    kind: 'unit',
    combatRole: 'any',
    zone: 'battlefield',
    allegiance: 'friendly',
  },
  effects: [{ type: 'stun-with-enemy-here' }],
  text: "[Hidden] (Hide now for {power:any} to react with later for {energy:0}.)\n[Action] (Play on your turn or in showdowns.)\nStun a friendly unit and an enemy unit at the same battlefield. (They don't deal combat damage this turn.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/b7cddc717b886bb955b900ffaae4db9154a19280-744x1039.png?accountingTag=RB',
});
