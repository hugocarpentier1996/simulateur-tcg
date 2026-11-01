import { defineUnit } from '../unit-definition.js';
/** OGN-157 : dépenser son buff : un mode non choisi ce tour — 2 dégâts à une unité sur un
 * champ, étourdir une unité sur un champ, se redresser, ou gagner Ganking ce tour. */
export const udyr = defineUnit({
  id: 'ogn-157-298',
  name: 'Udyr',
  type: 'unit',
  might: 6,
  cost: { energy: 6, power: { orange: 1 } },
  buffSpendModes: true,
  text: "Spend my buff: Choose one you've not chosen this turn —Deal 2 to a unit at a battlefield.Stun a unit at a battlefield.Ready me.Give me [Ganking] this turn.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/2e461e5d05b5ee86e47a425c42c6f3b3c12bc4cf-744x1039.png?accountingTag=RB',
});
