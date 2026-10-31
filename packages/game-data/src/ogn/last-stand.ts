import { defineSpell } from '../spell-definition.js';
/** OGN-069 : Action ; double la Might d'une unité alliée ce tour et lui donne Temporary. */
export const lastStand = defineSpell({
  id: 'ogn-069-298',
  name: 'Last Stand',
  type: 'spell',
  timing: 'action',
  cost: { energy: 3, power: { vert: 1 } },
  target: { kind: 'unit', combatRole: 'any', allegiance: 'friendly' },
  effects: [{ type: 'double-might-temporary' }],
  text: "[Action] (Play on your turn or in showdowns.)\nDouble a friendly unit's Might this turn. Give it [Temporary]. (Kill it at the start of its controller's Beginning Phase, before scoring.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/9062d372d299c5c6a0c679f0ff07ba71590ca5f1-744x1039.png?accountingTag=RB',
});
