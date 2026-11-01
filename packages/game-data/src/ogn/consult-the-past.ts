import { defineSpell } from '../spell-definition.js';
/** OGN-083 : Hidden ; Réaction ; pioche 2. */
export const consultThePast = defineSpell({
  id: 'ogn-083-298',
  name: 'Consult the Past',
  type: 'spell',
  timing: 'reaction',
  hidden: true,
  cost: { energy: 4, power: {} },
  target: { kind: 'caster' },
  effects: [{ type: 'draw', count: 2, player: 'caster' }],
  text: '[Hidden] (Hide now for {power:any} to react with later for {energy:0}.)\n[Reaction] (Play any time, even before spells and abilities resolve.)\nDraw 2.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/198d950d3933972273ec714e9264cbd563ea6920-744x1039.png?accountingTag=RB',
});
