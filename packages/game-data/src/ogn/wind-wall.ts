import { defineSpell } from '../spell-definition.js';
/** OGN-064 : Réaction ; contre un sort de la pile. */
export const windWall = defineSpell({
  id: 'ogn-064-298',
  name: 'Wind Wall',
  type: 'spell',
  timing: 'reaction',
  cost: { energy: 3, power: { vert: 2 } },
  target: { kind: 'stack-spell' },
  effects: [{ type: 'counter-spell' }],
  text: '[Reaction] (Play any time, even before spells and abilities resolve.)\nCounter a spell.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/72c4dbe48d06916c847dab40340e5f05228fadfe-744x1039.png?accountingTag=RB',
});
