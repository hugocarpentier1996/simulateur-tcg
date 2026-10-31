import { defineSpell } from '../spell-definition.js';
/** OGN-173 : déplace une unité alliée (sans exiger Ready) puis la redresse. */
export const rideTheWind = defineSpell({
  id: 'ogn-173-298',
  name: 'Ride the Wind',
  type: 'spell',
  timing: 'action',
  cost: { energy: 2, power: { violet: 1 } },
  target: { kind: 'unit', combatRole: 'any', allegiance: 'friendly' },
  effects: [
    { type: 'move-unit', requiresReady: false, exhaustsUnit: false },
    { type: 'ready-unit' },
  ],
  text: '[Action] (Play on your turn or in showdowns.)\nMove a friendly unit and ready it.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/864d9f8992db7f9a9e795d9438d941ca564ddde7-744x1039.png?accountingTag=RB',
});
