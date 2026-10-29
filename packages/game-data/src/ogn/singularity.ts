import { defineSpell } from '../spell-definition.js';
export const singularity = defineSpell({
  id: 'ogn-105-298',
  name: 'Singularity',
  text: 'Deal 6 to each of up to two units.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/792edce1a64d4a92740aa3fa240e21e161513944-744x1039.png?accountingTag=RB',
  type: 'spell',
  timing: 'normal',
  cost: { energy: 6, power: { bleu: 2 } },
  target: { kind: 'caster' },
  effects: [{ type: 'damage-selected-units', maximum: 2, amount: 6 }],
});
