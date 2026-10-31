import { defineSpell } from '../spell-definition.js';
/** OGN-133 : Réaction ; 1 dégât à toutes les unités sur les champs de bataille. */
export const flurryOfBlades = defineSpell({
  id: 'ogn-133-298',
  name: 'Flurry of Blades',
  type: 'spell',
  timing: 'reaction',
  cost: { energy: 1, power: {} },
  target: { kind: 'caster' },
  effects: [{ type: 'damage-all-at-battlefields', amount: 1 }],
  text: '[Reaction] (Play any time, even before spells and abilities resolve.)\nDeal 1 to all units at battlefields.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/c72f872e7e71b55b2074c5be4f2d7a44fa6fafca-744x1039.png?accountingTag=RB',
});
