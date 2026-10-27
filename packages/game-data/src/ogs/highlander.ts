import { defineSpell } from '../spell-definition.js';

/** OGS-020/024 : protection consommable contre la prochaine mort du tour. */
export const highlander = defineSpell({
  id: 'ogs-020-024',
  name: 'Highlander',
  type: 'spell',
  timing: 'reaction',
  cost: { energy: 4, power: {} },
  target: { kind: 'unit', combatRole: 'any', allegiance: 'friendly' },
  effects: [{ type: 'recall-on-death', duration: 'end-of-turn' }],
  text: "[Reaction] (Play any time, even before spells and abilities resolve.)\nChoose a friendly unit. The next time it dies this turn, recall it exhausted instead. (Send it to base. This isn't a move.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/18c0818cbbfdf26a1237b4f7703b1f035f47b014-744x1039.png?accountingTag=RB',
});
