import { defineSpell } from '../spell-definition.js';

/** OGS-011 : déplacement par Réaction, sans épuiser ni soigner. */
export const flash = defineSpell({
  id: 'ogs-011-024',
  name: 'Flash',
  type: 'spell',
  timing: 'reaction',
  cost: { energy: 2, power: {} },
  target: { kind: 'caster' },
  effects: [{ type: 'move-up-to-two-allies-to-base' }],
  text: '[Reaction] (Play any time, even before spells and abilities resolve.)\nMove up to 2 friendly units to base.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/4d9cc1c13b75933e509e642213f13359350cd3f9-744x1039.png?accountingTag=RB',
});
