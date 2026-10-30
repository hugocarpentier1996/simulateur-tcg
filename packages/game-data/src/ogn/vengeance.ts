import { defineSpell } from '../spell-definition.js';
/** OGN-229 : sort normal, tue une unité quelconque. */
export const vengeance = defineSpell({
  id: 'ogn-229-298',
  name: 'Vengeance',
  type: 'spell',
  timing: 'normal',
  cost: { energy: 4, power: { jaune: 2 } },
  target: { kind: 'unit', combatRole: 'any' },
  effects: [{ type: 'kill-unit' }],
  text: 'Kill a unit.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/a21e2ffee47ecdd1575bf48edb8c2a84722cc6b9-744x1039.png?accountingTag=RB',
});
