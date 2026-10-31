import { defineBattlefield } from '../battlefield-definition.js';
/** OGN-284 : au début de la première Beginning de chaque joueur, il canalise 1 rune. */
export const obeliskOfPower = defineBattlefield({
  id: 'ogn-284-298',
  name: 'Obelisk of Power',
  type: 'battlefield',
  firstBeginning: 'channel',
  text: "At the start of each player's first Beginning Phase, that player channels 1 rune.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/0ef4890cdc3145616fcf41290a13c63b1afe4e0d-1038x744.png?accountingTag=RB',
});
