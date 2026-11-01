import { defineSpell } from '../spell-definition.js';
/** OGN-237 : chaque autre joueur choisit une unité que le lanceur ne contrôle pas ; elles
 * meurent (en 1v1 : l'adversaire choisit une de ses unités). */
export const kingsEdict = defineSpell({
  id: 'ogn-237-298',
  name: "King's Edict",
  type: 'spell',
  timing: 'normal',
  cost: { energy: 6, power: { jaune: 2 } },
  target: { kind: 'caster' },
  effects: [{ type: 'each-player-kills', what: 'unit', opponentsOnly: true }],
  text: "Starting with the next player, each other player chooses a unit you don't control that hasn't been chosen for this spell. Kill those units.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/ec1b8b98e1ca7a34939322883309c71605bb8bc5-744x1039.png?accountingTag=RB',
});
