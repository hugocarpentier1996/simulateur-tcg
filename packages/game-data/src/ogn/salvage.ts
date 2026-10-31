import { defineSpell } from '../spell-definition.js';
/** OGN-224 : Action ; peut détruire un équipement (cible = lanceur pour s'en abstenir), puis pioche 1. */
export const salvage = defineSpell({
  id: 'ogn-224-298',
  name: 'Salvage',
  type: 'spell',
  timing: 'action',
  cost: { energy: 2, power: { jaune: 1 } },
  target: { kind: 'optional-gear' },
  effects: [
    { type: 'kill-target-gear' },
    { type: 'draw', count: 1, player: 'caster' },
  ],
  text: '[Action] (Play on your turn or in showdowns.)\nYou may kill a gear. Draw 1.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/9bdbac358e7c9415c1354b6d1f6888dcf9c5519b-744x1039.png?accountingTag=RB',
});
