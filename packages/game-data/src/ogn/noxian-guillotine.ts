import { defineSpell } from '../spell-definition.js';
/** OGN-254 : Action ; la cible meurt la prochaine fois qu'elle subit des dégâts ce tour ;
 * Legion — elle meurt aussitôt. Power hybride Fury/Order. */
export const noxianGuillotine = defineSpell({
  id: 'ogn-254-298',
  name: 'Noxian Guillotine',
  type: 'spell',
  timing: 'action',
  cost: { energy: 4, power: {}, powerChoice: ['rouge', 'jaune'] },
  target: { kind: 'unit', combatRole: 'any' },
  effects: [{ type: 'guillotine' }],
  text: "[Action] (Play on your turn or in showdowns.)\nChoose a unit. Kill it the next time it takes damage this turn.\n[Legion] — Kill it now instead. (Get the effect if you've played another card this turn.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/57f646b0393b58b657cfabf66357d9fc4a34e046-744x1039.png?accountingTag=RB',
});
