import { defineUnit } from '../unit-definition.js';
/** OGN-086 : Vision ; Shield. */
export const jeweledColossus = defineUnit({
  id: 'ogn-086-298',
  name: 'Jeweled Colossus',
  type: 'unit',
  cost: { energy: 5, power: {} },
  might: 5,
  onPlayVision: true,
  shield: 1,
  text: "[Vision] (When you play me, look at the top card of your Main Deck. You may recycle it.)\n[Shield] (+1 {might} while I'm a defender.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/775bea14038165fd9feb15c796ed84aa00a032e1-744x1039.png?accountingTag=RB',
});
