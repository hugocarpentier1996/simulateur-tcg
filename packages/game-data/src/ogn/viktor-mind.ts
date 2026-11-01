import { defineUnit } from '../unit-definition.js';
/** OGN-117 : quand son propriétaire joue une carte pendant le tour adverse, joue un jeton
 * Recrue 1 dans sa base (sans pile). */
export const viktorMind = defineUnit({
  id: 'ogn-117-298',
  name: 'Viktor',
  type: 'unit',
  cost: { energy: 4, power: { bleu: 1 } },
  might: 3,
  recruitOnOffTurnPlay: 'ogs-recruit-token',
  text: "When you play a card on an opponent's turn, play a 1 {might} Recruit unit token in your base.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/35be0b10f13611b4f5d828f2a79001036ab57ba1-744x1039.png?accountingTag=RB',
});
