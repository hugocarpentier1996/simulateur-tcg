import { defineUnit } from '../unit-definition.js';
/** OGN-031 : à la mise en jeu, le prochain sort joué ce tour coûte 5 énergie de moins. */
export const ragingFirebrand = defineUnit({
  id: 'ogn-031-298',
  name: 'Raging Firebrand',
  type: 'unit',
  cost: { energy: 6, power: { rouge: 1 } },
  might: 4,
  onPlayEffect: { type: 'next-spell-discount', energy: 5 },
  text: 'When you play me, the next spell you play this turn costs {energy:5} less.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/9566fc064c098bd7f3540f3074dc6353c7ca5663-744x1039.png?accountingTag=RB',
});
