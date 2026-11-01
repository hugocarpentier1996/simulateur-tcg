import { defineUnit } from '../unit-definition.js';
/** OGN-193 : peut être jouée sur un champ libre ; les unités alliées aussi. */
export const missFortuneChaos = defineUnit({
  id: 'ogn-193-298',
  name: 'Miss Fortune',
  type: 'unit',
  cost: { energy: 4, power: { violet: 1 } },
  might: 4,
  canPlayToOpenBattlefield: true,
  alliesCanPlayToOpenBattlefield: true,
  text: 'You may play me to an open battlefield.\nFriendly units may be played to open battlefields.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/e6ff9ad3d6e2b96ff76cda4c7bc75415c1cdcced-744x1039.png?accountingTag=RB',
});
