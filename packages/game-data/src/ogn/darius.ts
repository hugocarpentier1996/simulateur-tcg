import { defineUnit } from '../unit-definition.js';
/** OGN-243 : Legion — entre Ready si une autre carte a été jouée ce tour ;
 * +1 Might aux autres unités alliées de sa zone. */
export const darius = defineUnit({
  id: 'ogn-243-298',
  name: 'Darius',
  type: 'unit',
  cost: { energy: 6, power: { jaune: 1 } },
  might: 6,
  legionReady: true,
  otherAlliesHereMightBonus: 1,
  text: "[Legion] — When you play me, ready me. (Get the effect if you've played another card this turn)\nOther friendly units have +1 {might} here.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/7b71cf13a07074a6eccbe88ae6c74133d989cb68-744x1039.png?accountingTag=RB',
});
