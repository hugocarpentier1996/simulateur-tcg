import { defineUnit } from '../unit-definition.js';
/** OGN-073 : sur un champ, redresse 4 runes alliées à la fin du tour de son propriétaire. */
export const sona = defineUnit({
  id: 'ogn-073-298',
  name: 'Sona',
  type: 'unit',
  cost: { energy: 4, power: { vert: 1 } },
  might: 4,
  readyRunesAtEndAtBattlefield: 4,
  text: "While I'm at a battlefield, ready 4 friendly runes at the end of your turn.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/8582f6430821fb912fcb3619c5ce9405f254cb2f-744x1039.png?accountingTag=RB',
});
