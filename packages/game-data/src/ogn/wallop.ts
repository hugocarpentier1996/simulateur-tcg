import { defineSpell } from '../spell-definition.js';
/** OGN-146 : Action ; redresse une unité. Peut dépenser un buff allié pour ignorer le coût. */
export const wallop = defineSpell({
  id: 'ogn-146-298',
  name: 'Wallop',
  type: 'spell',
  timing: 'action',
  cost: { energy: 2, power: {} },
  spendBuffForFreeCast: true,
  target: { kind: 'unit', combatRole: 'any' },
  effects: [{ type: 'ready-unit' }],
  text: "[Action] (Play on your turn or in showdowns.)\nAs you play this, you may spend a buff as an additional cost. If you do, ignore this spell's cost.\nReady a unit.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/7bbd2eb8ce224e1872a1c920d7c64d796b2355cd-744x1039.png?accountingTag=RB',
});
