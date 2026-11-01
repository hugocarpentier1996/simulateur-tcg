import { defineGear } from '../gear-definition.js';
/** OGN-227 : si un combat où son propriétaire attaque finit à égalité (des unités des deux
 * camps restent), toutes les unités du champ sont rappelées dans leur base. */
export const symbolOfTheSolari = defineGear({
  id: 'ogn-227-298',
  name: 'Symbol of the Solari',
  type: 'gear',
  cost: { energy: 1, power: {} },
  effects: [],
  tieRecallAll: true,
  text: "If a combat where you are the attacker ends in a tie, recall ALL units instead. (Send them to base. This isn't a move. Ties are calculated after combat damage is dealt.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/d4f746c396df48623ef8a4df763b5deb47f59339-744x1039.png?accountingTag=RB',
});
