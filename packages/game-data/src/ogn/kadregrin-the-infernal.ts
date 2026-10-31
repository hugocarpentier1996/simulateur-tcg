import { defineUnit } from '../unit-definition.js';
/** OGN-038 : à la mise en jeu, pioche 1 par unité alliée Mighty (5+ Might). */
export const kadregrinTheInfernal = defineUnit({
  id: 'ogn-038-298',
  name: 'Kadregrin the Infernal',
  type: 'unit',
  cost: { energy: 9, power: { rouge: 2 } },
  might: 9,
  onPlayEffect: { type: 'draw-per-mighty' },
  text: 'When you play me, draw 1 for each of your [Mighty] units. (A unit is Mighty while it has 5+ {might}.)',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/733c32b1fccc7e2983cbb3586358152f90a6df04-744x1039.png?accountingTag=RB',
});
