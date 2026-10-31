import { defineSpell } from '../spell-definition.js';
/** OGN-221 : Action ; ce tour, toute unité qui subit des dégâts est tuée. */
export const imperialDecree = defineSpell({
  id: 'ogn-221-298',
  name: 'Imperial Decree',
  type: 'spell',
  timing: 'action',
  cost: { energy: 5, power: { jaune: 2 } },
  target: { kind: 'caster' },
  effects: [{ type: 'damage-kills-this-turn' }],
  text: '[Action] (Play on your turn or in showdowns.)\nWhen any unit takes damage this turn, kill it.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/fc6ab617f1ce20c82ed76dc6446d42d416c08b34-744x1039.png?accountingTag=RB',
});
