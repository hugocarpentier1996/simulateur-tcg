import { defineUnit } from '../unit-definition.js';
/** OGN-100 : Vision ; les autres unités alliées ont Vision. */
export const gemcraftSeer = defineUnit({
  id: 'ogn-100-298',
  name: 'Gemcraft Seer',
  type: 'unit',
  might: 3,
  cost: { energy: 3, power: { bleu: 1 } },
  onPlayVision: true,
  alliesHaveVision: true,
  text: '[Vision] (When you play me, look at the top card of your Main Deck. You may recycle it.)\nOther friendly units have [Vision].',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/4b6965bd592a5f602ab932094d677b6c85b2372b-744x1039.png?accountingTag=RB',
});
