import { defineSpell } from '../spell-definition.js';
/** OGN-203 : Action ; prend le contrôle d'une unité ennemie sur un champ et la rappelle dans
 * la base du lanceur (pas un déplacement). */
export const possession = defineSpell({
  id: 'ogn-203-298',
  name: 'Possession',
  type: 'spell',
  timing: 'action',
  cost: { energy: 8, power: { violet: 3 } },
  target: {
    kind: 'unit',
    combatRole: 'any',
    zone: 'battlefield',
    allegiance: 'enemy',
  },
  effects: [{ type: 'steal-and-recall' }],
  text: "[Action] (Play on your turn or in showdowns.)\nChoose an enemy unit at a battlefield. Take control of it and recall it. (Send it to your base. This isn't a move.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/f26462174fd01407f25f7d49a70862d2b9af35cc-744x1039.png?accountingTag=RB',
});
