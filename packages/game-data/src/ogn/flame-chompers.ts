import { defineUnit } from '../unit-definition.js';
/** OGN-006 : quand elle est défaussée, son propriétaire peut payer 1 Power Fury pour la jouer
 * (dans sa base, Tap). */
export const flameChompers = defineUnit({
  id: 'ogn-006-298',
  name: 'Flame Chompers',
  type: 'unit',
  might: 3,
  cost: { energy: 3, power: {} },
  playOnDiscard: { power: 'rouge' },
  text: 'When you discard me, you may pay {power:fury} to play me.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/1f6f5ebd18e5daac30d62626fddd785c4b457c2b-744x1039.png?accountingTag=RB',
});
