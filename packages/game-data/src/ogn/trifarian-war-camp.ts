import { defineBattlefield } from '../battlefield-definition.js';
export const trifarianWarCamp = defineBattlefield({
  id: 'ogn-294-298',
  name: 'Trifarian War Camp',
  text: 'Units here have +1 {might}. (This includes attackers.)',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/3788cf718e716e35a7fa20ec1dc56991644e6484-1038x744.png?accountingTag=RB',
  type: 'battlefield',
  unitMightBonus: 1,
});
