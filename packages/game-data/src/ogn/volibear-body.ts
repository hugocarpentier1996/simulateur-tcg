import { defineUnit } from '../unit-definition.js';
/** OGN-158 : Shield 3, Tank ; quand une unité adverse se déplace vers un autre champ que le
 * sien, son propriétaire pioche 1 (sans pile). */
export const volibearBody = defineUnit({
  id: 'ogn-158-298',
  name: 'Volibear',
  type: 'unit',
  cost: { energy: 12, power: { orange: 2 } },
  might: 10,
  shield: 3,
  tank: true,
  drawOnEnemyMoveElsewhere: true,
  text: "[Shield 3] (+3 {might} while I'm a defender.)\n[Tank] (I must be assigned combat damage first.)\nWhen an opponent moves to a battlefield other than mine, draw 1. (Bases are not battlefield.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/bcb15f95f4a72f8b070a3b1cd54e6482fe1a4b3e-744x1039.png?accountingTag=RB',
});
