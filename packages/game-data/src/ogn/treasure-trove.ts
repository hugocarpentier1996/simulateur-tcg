import { defineGear } from '../gear-definition.js';
/** OGN-186 : quand il quitte le terrain, pioche 1 et canalise 1 rune Tap ;
 * 1 Power Chaos + Tap : se détruit. */
export const treasureTrove = defineGear({
  id: 'ogn-186-298',
  name: 'Treasure Trove',
  type: 'gear',
  cost: { energy: 2, power: {} },
  effects: [],
  onLeaveDrawChannel: true,
  tapAbility: {
    cost: { energy: 0, power: { violet: 1 } },
    target: {},
    effect: { type: 'kill-self' },
  },
  text: 'When this leaves the board, draw 1 and channel 1 rune exhausted.\n{power:chaos}, {exhaust}: Kill this.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/682f5ee828ede4dbaf428cd0666db64ee8bae722-744x1039.png?accountingTag=RB',
});
