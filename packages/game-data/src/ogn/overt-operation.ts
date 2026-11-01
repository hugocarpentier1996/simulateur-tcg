import { defineSpell } from '../spell-definition.js';
/** OGN-153 : Action ; chaque alliée Tap buffée dépense son buff pour se redresser
 * (automatique, hypothèse), puis toutes les unités alliées sont buffées. */
export const overtOperation = defineSpell({
  id: 'ogn-153-298',
  name: 'Overt Operation',
  type: 'spell',
  timing: 'action',
  cost: { energy: 5, power: { orange: 2 } },
  target: { kind: 'caster' },
  effects: [{ type: 'spend-buffs-ready-then-buff-all' }],
  text: "[Action] (Play on your turn or in showdowns.)\nFor each friendly unit, you may spend its buff to ready it. Then buff all friendly units. (Each one that doesn't have a buff gets a +1 {might} buff.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/69dba13c930ba3962851346d2bc6cbeb4ca48455-744x1039.png?accountingTag=RB',
});
