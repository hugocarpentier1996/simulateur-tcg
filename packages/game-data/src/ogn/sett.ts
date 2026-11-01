import { defineUnit } from '../unit-definition.js';
/** OGN-164 : se buffe quand il est joué et quand il conquiert ; dépenser son buff : +4 Might
 * ce tour. */
export const sett = defineUnit({
  id: 'ogn-164-298',
  name: 'Sett',
  type: 'unit',
  might: 4,
  cost: { energy: 5, power: { orange: 1 } },
  onPlayEffect: { type: 'buff-self' },
  onConquerBuffSelf: true,
  buffSpendMight: 4,
  text: "When I'm played and when I conquer, buff me. (If I don't have a buff, I get a +1 {might} buff.)\nSpend my buff: Give me +4 {might} this turn.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/00ddd4d478f2e49e18a60ed67f4d1452041b7da3-744x1039.png?accountingTag=RB',
});
