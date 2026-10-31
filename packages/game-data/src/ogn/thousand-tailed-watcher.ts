import { defineUnit } from '../unit-definition.js';
/** OGN-116 : Accelerate (Mind) ; à la mise en jeu, -3 Might aux unités ennemies ce tour, minimum 1. */
export const thousandTailedWatcher = defineUnit({
  id: 'ogn-116-298',
  name: 'Thousand-Tailed Watcher',
  type: 'unit',
  cost: { energy: 7, power: { bleu: 1 } },
  might: 7,
  accelerate: { power: 'bleu' },
  onPlayEffect: { type: 'weaken-enemies', amount: -3, minimum: 1 },
  text: '[Accelerate] (You may pay {energy:1}{power:mind} as an additional cost to have me enter ready.)\nWhen you play me, give enemy units -3 {might} this turn, to a minimum of 1 {might}.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/b20e5644c33924a58e0497dd9f7db19723147003-744x1039.png?accountingTag=RB',
});
