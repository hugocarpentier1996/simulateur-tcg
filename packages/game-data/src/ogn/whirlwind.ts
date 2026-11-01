import { defineSpell } from '../spell-definition.js';
/** OGN-187 : en commençant par le joueur suivant, chacun peut renvoyer une unité dans la main
 * de son propriétaire. */
export const whirlwind = defineSpell({
  id: 'ogn-187-298',
  name: 'Whirlwind',
  type: 'spell',
  timing: 'normal',
  cost: { energy: 3, power: { violet: 1 } },
  target: { kind: 'caster' },
  effects: [{ type: 'each-player-may-return-unit' }],
  text: "Starting with the next player, each player may return a unit to its owner's hand.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/24f5e0a8811b5a0e0930c0f6476600e2a37a5f93-744x1039.png?accountingTag=RB',
});
