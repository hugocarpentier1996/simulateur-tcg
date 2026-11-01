import { defineSpell } from '../spell-definition.js';
/** OGN-264 : reprend jusqu'à 2 cartes Hidden de son cimetière ; cacher des cartes ne coûte
 * rien ce tour. */
export const guerillaWarfare = defineSpell({
  id: 'ogn-264-298',
  name: 'Guerilla Warfare',
  type: 'spell',
  timing: 'normal',
  cost: { energy: 2, power: { bleu: 1 } },
  target: { kind: 'caster' },
  effects: [{ type: 'return-hidden-free-hide', maximum: 2 }],
  text: 'Return up to two cards with [Hidden] from your trash to your hand. You can hide cards ignoring costs this turn.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/3a1f70e49f1fdbac907a3395f517e96717e8afea-744x1039.png?accountingTag=RB',
});
