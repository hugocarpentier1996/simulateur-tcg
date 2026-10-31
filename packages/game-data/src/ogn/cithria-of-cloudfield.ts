import { defineUnit } from '../unit-definition.js';
/** OGN-139 : quand son propriétaire joue une autre unité, elle se buffe. */
export const cithriaOfCloudfield = defineUnit({
  id: 'ogn-139-298',
  name: 'Cithria of Cloudfield',
  type: 'unit',
  cost: { energy: 2, power: {} },
  might: 1,
  buffOnAllyPlayed: true,
  text: "When you play another unit, buff me. (If I don't have a buff, I get a +1 {might} buff.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/6f0931db65e25e0a8d8351ffb97f8deed5dc0aa9-744x1039.png?accountingTag=RB',
});
