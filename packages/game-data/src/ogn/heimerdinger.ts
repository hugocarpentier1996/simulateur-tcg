import { defineUnit } from '../unit-definition.js';
/** OGN-111 : a toutes les capacités Tap des légendes, unités et gears alliés (il se couche
 * lui-même pour les utiliser). */
export const heimerdinger = defineUnit({
  id: 'ogn-111-298',
  name: 'Heimerdinger',
  type: 'unit',
  might: 3,
  cost: { energy: 3, power: { bleu: 1 } },
  copiesTapAbilities: true,
  text: 'I have all {exhaust} abilities of all friendly legends, units, and gear.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/5b14a5f9d567c90329c151a8cc72d870b47b1434-744x1039.png?accountingTag=RB',
});
