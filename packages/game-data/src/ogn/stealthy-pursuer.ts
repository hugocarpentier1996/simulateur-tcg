import { defineUnit } from '../unit-definition.js';
/** OGN-177 : quand une unité alliée quitte sa zone en se déplaçant, il peut se déplacer avec
 * elle (capacité sur la pile). */
export const stealthyPursuer = defineUnit({
  id: 'ogn-177-298',
  name: 'Stealthy Pursuer',
  type: 'unit',
  might: 4,
  cost: { energy: 4, power: { violet: 1 } },
  followsAllies: true,
  text: 'When a friendly unit moves from my location, I may be moved with it.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/ab23fd84badd67e9981512acbe6c3e9a8f97f42d-744x1039.png?accountingTag=RB',
});
