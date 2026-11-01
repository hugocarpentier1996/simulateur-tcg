import { defineSpell } from '../spell-definition.js';
/** OGN-256 : Hidden ; Action ; tue des unités d'un même champ totalisant 4 Might ou moins. */
export const foxFire = defineSpell({
  id: 'ogn-256-298',
  name: 'Fox-Fire',
  type: 'spell',
  timing: 'action',
  hidden: true,
  cost: { energy: 3, power: {} },
  target: { kind: 'caster' },
  effects: [{ type: 'kill-selected-total-might', maximum: 4 }],
  text: '[Hidden] (Hide now for {power:any} to react with later for {energy:0}.)\n[Action] (Play on your turn or in showdowns.)\nKill any number of units at a battlefield with total Might 4 or less.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/7ad9d6a46a1c54080d54950a0044da3a82e32b45-744x1039.png?accountingTag=RB',
});
