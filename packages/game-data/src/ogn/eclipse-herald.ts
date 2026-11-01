import { defineUnit } from '../unit-definition.js';
/** OGN-059 : quand son propriétaire étourdit une unité ennemie, se redresse et gagne +1 Might
 * ce tour (une fois par action, sans pile). */
export const eclipseHerald = defineUnit({
  id: 'ogn-059-298',
  name: 'Eclipse Herald',
  type: 'unit',
  cost: { energy: 7, power: { vert: 1 } },
  might: 7,
  onEnemyStunned: { might: 1, ready: true },
  text: 'When you stun an enemy unit, ready me and give me +1 {might} this turn.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/bbe4fec278b8960681f97da658dc2f06ee46c4bd-744x1039.png?accountingTag=RB',
});
