import { defineSpell } from '../spell-definition.js';

/** OGS-002/024 : sort Normal, dégâts simultanés aux ennemis du champ choisi. */
export const firestorm = defineSpell({
  id: 'ogs-002-024',
  name: 'Firestorm',
  type: 'spell',
  timing: 'normal',
  cost: { energy: 6, power: { rouge: 1 } },
  target: { kind: 'battlefield' },
  effects: [{ type: 'damage-enemies-at-battlefield', amount: 3 }],
  text: 'Deal 3 to all enemy units at a battlefield.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/a7a34129e64f0296bf2da166c2b06ed156d568db-744x1039.png?accountingTag=RB',
});
