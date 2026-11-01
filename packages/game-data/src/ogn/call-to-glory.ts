import { defineSpell } from '../spell-definition.js';
/** OGN-207 : Réaction ; +3 Might à une unité ce tour. Peut dépenser un buff allié pour
 * ignorer le coût. */
export const callToGlory = defineSpell({
  id: 'ogn-207-298',
  name: 'Call to Glory',
  type: 'spell',
  timing: 'reaction',
  cost: { energy: 3, power: {} },
  spendBuffForFreeCast: true,
  target: { kind: 'unit', combatRole: 'any' },
  effects: [{ type: 'modify-might', amount: 3, duration: 'end-of-turn' }],
  text: "[Reaction] (Play any time, even before spells and abilities resolve.)\nAs you play this, you may spend a buff as an additional cost. If you do, ignore this spell's cost.\nGive a unit +3 {might} this turn.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/ced53bc3fb15f263471067fc3868295b09e62a07-744x1039.png?accountingTag=RB',
});
