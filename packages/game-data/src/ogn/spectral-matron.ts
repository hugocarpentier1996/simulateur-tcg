import { defineUnit } from '../unit-definition.js';
/** OGN-226 : à la mise en jeu, peut jouer gratuitement une unité de son cimetière coûtant au
 * plus 3 énergie et 1 Power. */
export const spectralMatron = defineUnit({
  id: 'ogn-226-298',
  name: 'Spectral Matron',
  type: 'unit',
  might: 4,
  cost: { energy: 4, power: { jaune: 2 } },
  onPlayFromTrash: { maxEnergy: 3, maxPower: 1 },
  text: 'When you play me, you may play a unit costing no more than {energy:3} and no more than {power:any} from your trash, ignoring its cost.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/c8aebd03c8722d485ebfc38774488778c756ff5c-744x1039.png?accountingTag=RB',
});
