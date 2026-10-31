import { defineSpell } from '../spell-definition.js';
/** OGN-014 : Action ; énergie réduite de la plus haute Might parmi ses unités ;
 * 5 dégâts à une unité sur un champ. */
export const skySplitter = defineSpell({
  id: 'ogn-014-298',
  name: 'Sky Splitter',
  type: 'spell',
  timing: 'action',
  cost: { energy: 8, power: { rouge: 1 } },
  costReduction: { kind: 'highest-own-might' },
  target: { kind: 'unit', combatRole: 'any', zone: 'battlefield' },
  effects: [{ type: 'damage', amount: 5 }],
  text: "[Action] (Play on your turn or in showdowns.)\nThis spell's Energy cost is reduced by the highest Might among units you control.\nDeal 5 to a unit at a battlefield.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/01faae468720dd5bf5e3fe12ba56c01af70263be-744x1039.png?accountingTag=RB',
});
