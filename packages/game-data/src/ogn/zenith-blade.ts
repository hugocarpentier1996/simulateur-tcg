import { defineSpell } from '../spell-definition.js';
/** OGN-262 : Action ; étourdit une unité ennemie sur un champ, puis peut y déplacer une
 * unité alliée (secondaryTargetId facultatif). */
export const zenithBlade = defineSpell({
  id: 'ogn-262-298',
  name: 'Zenith Blade',
  type: 'spell',
  timing: 'action',
  cost: {
    energy: 3,
    power: {},
    powerChoice: ['vert', 'jaune'],
    powerChoiceAmount: 2,
  },
  target: {
    kind: 'unit',
    combatRole: 'any',
    zone: 'battlefield',
    allegiance: 'enemy',
  },
  effects: [
    { type: 'stun', duration: 'end-of-turn' },
    { type: 'move-ally-to-target' },
  ],
  text: "[Action] (Play on your turn or in showdowns.)\nStun an enemy unit at a battlefield. You may move a friendly unit to that enemy unit's battlefield. (A stunned unit doesn't deal combat damage this turn.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/a572f0bc3ed1bd47c5759d36f5b951b15338e57e-744x1039.png?accountingTag=RB',
});
