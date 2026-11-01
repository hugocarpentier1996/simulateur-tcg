import { defineSpell } from '../spell-definition.js';
/** OGN-080 : Réaction ; prend le contrôle d'un sort de la pile (ses choix sont conservés,
 * hypothèse). */
export const mysticReversal = defineSpell({
  id: 'ogn-080-298',
  name: 'Mystic Reversal',
  type: 'spell',
  timing: 'reaction',
  cost: { energy: 4, power: { vert: 3 } },
  target: { kind: 'stack-spell' },
  effects: [{ type: 'steal-spell' }],
  text: '[Reaction] (Play any time, even before spells and abilities resolve.)\nGain control of a spell. You may make new choices for it.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/298fe91f9d76086b7d77880e11016ed46389b61b-744x1039.png?accountingTag=RB',
});
