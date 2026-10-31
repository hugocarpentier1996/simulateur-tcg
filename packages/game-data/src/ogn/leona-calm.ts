import { defineUnit } from '../unit-definition.js';
/** OGN-079 : entre Ready si un adversaire est à 3 points ou moins de la victoire ;
 * les unités ennemies Stun de sa zone ont -8 Might (minimum 1). */
export const leonaCalm = defineUnit({
  id: 'ogn-079-298',
  name: 'Leona',
  type: 'unit',
  cost: { energy: 6, power: { vert: 1 } },
  might: 6,
  entersReadyIfOpponentWithin: 3,
  stunnedEnemiesHereMalus: 8,
  text: "If an opponent's score is within 3 points of the Victory Score, I enter ready.\nStunned enemy units here have -8 {might}, to a minimum of 1 {might}.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/3bd1e924bec41b0f733fc8b93dc8918ce5a53ba4-744x1039.png?accountingTag=RB',
});
