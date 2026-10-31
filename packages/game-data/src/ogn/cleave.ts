import { defineSpell } from '../spell-definition.js';
/** OGN-004 : une unité gagne Assault 3 jusqu'à la fin du tour. */
export const cleave = defineSpell({
  id: 'ogn-004-298',
  name: 'Cleave',
  type: 'spell',
  timing: 'action',
  cost: { energy: 1, power: {} },
  target: { kind: 'unit', combatRole: 'any' },
  effects: [{ type: 'grant-assault', amount: 3, duration: 'end-of-turn' }],
  text: "[Action] (Play on your turn or in showdowns.)\nGive a unit [Assault 3] this turn. (+3 {might} while it's an attacker.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/95d476a1e88ff547fb846149619177bc7e3cea9f-744x1039.png?accountingTag=RB',
});
