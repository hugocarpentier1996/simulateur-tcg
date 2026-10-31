import { defineSpell } from '../spell-definition.js';
/** OGN-144 : Réaction ; coûte 2 énergie de moins si une unité ennemie est morte ce tour ;
 * pioche 2. */
export const spoilsOfWar = defineSpell({
  id: 'ogn-144-298',
  name: 'Spoils of War',
  type: 'spell',
  timing: 'reaction',
  cost: { energy: 4, power: { orange: 1 } },
  costReduction: { kind: 'enemy-died-this-turn', energy: 2 },
  target: { kind: 'caster' },
  effects: [{ type: 'draw', count: 2, player: 'caster' }],
  text: '[Reaction] (Play any time, even before spells and abilities resolve.)\nIf an enemy unit has died this turn, this costs {energy:2} less.\nDraw 2.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/b8d59d015d6b8e15822b360447fcb364e14d550f-744x1039.png?accountingTag=RB',
});
