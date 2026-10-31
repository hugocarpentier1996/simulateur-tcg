import { defineSpell } from '../spell-definition.js';
/** OGN-260 : redresse une unité alliée ; elle inflige sa Might à une unité ennemie sur un champ. */
export const lastBreath = defineSpell({
  id: 'ogn-260-298',
  name: 'Last Breath',
  type: 'spell',
  timing: 'action',
  cost: { energy: 3, power: { vert: 1, violet: 1 } },
  target: { kind: 'unit', combatRole: 'any', allegiance: 'friendly' },
  effects: [
    { type: 'ready-unit' },
    { type: 'strike', enemyZone: 'battlefield' },
  ],
  text: '[Action] (Play on your turn or in showdowns.)\nReady a friendly unit. It deals damage equal to its Might to an enemy unit at a battlefield.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/e7e6dc840210124825f787095541a66ae5cea178-744x1039.png?accountingTag=RB',
});
