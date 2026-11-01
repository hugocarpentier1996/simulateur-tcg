import { defineLegend } from '../legend-definition.js';
/** OGN-269 : quand une unité buffée qu'il contrôle devrait mourir, payer 1 Power et coucher la
 * légende dépense son buff et la rappelle Tap à la place ; quand il conquiert, la légende se
 * redresse. */
export const theBoss = defineLegend({
  id: 'ogn-269-298',
  name: 'The Boss',
  type: 'legend',
  colors: ['orange', 'jaune'],
  saveBuffedFromDeath: true,
  readyOnConquer: true,
  text: "When a buffed unit you control would die, you may pay {power:any} and exhaust me to spend its buff and recall it exhausted instead. (Send it to base. This isn't a move.)\nWhen you conquer, ready me.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/b132becb843b2cf418cb110ead64758f49f51554-744x1039.png?accountingTag=RB',
});
