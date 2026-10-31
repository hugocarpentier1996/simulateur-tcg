import { defineSpell } from '../spell-definition.js';
/** OGN-045 : Réaction ; contre un sort coûtant au plus 4 énergie et 1 Power. */
export const defy = defineSpell({
  id: 'ogn-045-298',
  name: 'Defy',
  type: 'spell',
  timing: 'reaction',
  cost: { energy: 1, power: { vert: 1 } },
  target: { kind: 'stack-spell', maxEnergy: 4, maxPower: 1 },
  effects: [{ type: 'counter-spell' }],
  text: '[Reaction] (Play any time, even before spells and abilities resolve.)\nCounter a spell that costs no more than {energy:4} and no more than {power:any}.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/4989bfcc4bd7be77051f0c2c349a981ba9c273e0-744x1039.png?accountingTag=RB',
});
