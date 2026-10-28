import { defineSpell } from '../spell-definition.js';
export const mobilize = defineSpell({
  id: 'ogn-134-298',
  name: 'Mobilize',
  text: "Channel 1 rune exhausted. If you can't, draw 1.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/cb22153e84ce250192b8e6e75e7f4dc0b66a728c-744x1039.png?accountingTag=RB',
  type: 'spell',
  timing: 'normal',
  cost: { energy: 2, power: {} },
  target: { kind: 'caster' },
  effects: [{ type: 'channel-exhausted', count: 1, drawIfEmpty: true }],
});
