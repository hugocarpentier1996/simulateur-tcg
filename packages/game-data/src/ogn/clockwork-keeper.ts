import { defineUnit } from '../unit-definition.js';
/** OGN-044 : en la jouant, peut payer 1 Power Calm en plus pour piocher 1. */
export const clockworkKeeper = defineUnit({
  id: 'ogn-044-298',
  name: 'Clockwork Keeper',
  type: 'unit',
  cost: { energy: 2, power: {} },
  might: 2,
  optionalCost: { power: 'vert', draw: 1 },
  text: 'As you play me, you may pay {power:calm} as an additional cost. If you do, draw 1.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/417e606418349bb25d4b07d460fa043ad85f2778-744x1039.png?accountingTag=RB',
});
