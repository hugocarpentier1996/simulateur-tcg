import { defineSpell } from '../spell-definition.js';
/** OGN-094 : Hidden ; Action ; joue un jeton Sprite 3 Ready avec Temporary. */
export const spriteCall = defineSpell({
  id: 'ogn-094-298',
  name: 'Sprite Call',
  type: 'spell',
  timing: 'action',
  hidden: true,
  cost: { energy: 3, power: {} },
  target: { kind: 'caster' },
  effects: [
    { type: 'summon-recruits', definitionId: 'token-sprite', count: 1 },
  ],
  text: "[Hidden] (Hide now for {power:any} to react with later for {energy:0}.)\n[Action] (Play on your turn or in showdowns.)\nPlay a ready 3 {might} Sprite unit token with [Temporary]. (Kill it at the start of its controller's Beginning Phase, before scoring.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/ab3db48dcbb12b01151d3a08c2412020380b7ca5-744x1039.png?accountingTag=RB',
});
