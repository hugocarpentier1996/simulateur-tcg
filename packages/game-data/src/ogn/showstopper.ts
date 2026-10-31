import { defineSpell } from '../spell-definition.js';
/** OGN-270 : buffe une unité alliée de sa base puis la déplace sur un champ. Power hybride
 * Body/Order. */
export const showstopper = defineSpell({
  id: 'ogn-270-298',
  name: 'Showstopper',
  type: 'spell',
  timing: 'normal',
  cost: { energy: 1, power: {}, powerChoice: ['orange', 'jaune'] },
  target: {
    kind: 'unit',
    combatRole: 'any',
    zone: 'base',
    allegiance: 'friendly',
  },
  effects: [{ type: 'buff-unit' }, { type: 'move-to-battlefield' }],
  text: "Buff a friendly unit in your base, then move it to a battlefield. (If it doesn't have a buff, it gets a +1 {might} buff.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/c9b6f7a7cca1589fb53276f74ac8bc547b31e5ec-744x1039.png?accountingTag=RB',
});
