import { defineUnit } from '../unit-definition.js';
/** OGN-113 : tuer une autre unité alliée ou un gear allié, Tap : Action — ajoute 2 Power de
 * n'importe quel domaine (capacité ADD, sans pile). */
export const malzahar = defineUnit({
  id: 'ogn-113-298',
  name: 'Malzahar',
  type: 'unit',
  might: 3,
  cost: { energy: 4, power: {} },
  sacrificeResource: { anyPower: 2 },
  text: "Kill a friendly unit or gear, {exhaust}: [Action] — [Add] {power:any}{power:any}. (Use on your turn or in showdowns. Abilities that add resources can't be reacted to.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/ba1fa3a18b1c2ff132ad536577e53deb49bce1f9-744x1039.png?accountingTag=RB',
});
