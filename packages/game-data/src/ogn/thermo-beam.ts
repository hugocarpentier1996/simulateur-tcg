import { defineSpell } from '../spell-definition.js';
/** OGN-022 : Action ; détruit tous les équipements en jeu. */
export const thermoBeam = defineSpell({
  id: 'ogn-022-298',
  name: 'Thermo Beam',
  type: 'spell',
  timing: 'action',
  cost: { energy: 5, power: { rouge: 2 } },
  target: { kind: 'caster' },
  effects: [{ type: 'kill-all-gear' }],
  text: '[Action] (Play on your turn or in showdowns.)\nKill all gear.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/88661e852b864491e6d7f5f087caf4263f61c361-744x1039.png?accountingTag=RB',
});
