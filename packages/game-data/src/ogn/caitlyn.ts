import { defineUnit } from '../unit-definition.js';
/** OGN-068 : reçoit les dégâts de combat en dernier ; Tap, seulement sur un champ : inflige sa
 * Might à une unité sur un champ. */
export const caitlyn = defineUnit({
  id: 'ogn-068-298',
  name: 'Caitlyn',
  type: 'unit',
  cost: { energy: 3, power: { vert: 1 } },
  might: 3,
  backline: true,
  tapAbility: {
    requiresBattlefield: true,
    target: { zone: 'battlefield' },
    effect: { type: 'might-damage' },
  },
  text: "I must be assigned combat damage last.\n{exhaust}: Deal damage equal to my Might to a unit at a battlefield. Use this ability only while I'm at a battlefield.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/51e6bacf25d19e7c391367ff107efb9e0b9f1ff5-744x1039.png?accountingTag=RB',
});
