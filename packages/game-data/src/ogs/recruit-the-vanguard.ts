import { defineSpell } from '../spell-definition.js';
import { defineUnit } from '../unit-definition.js';
/** Jeton associé, hors décompte des 24 cartes OGS. */
export const recruitToken = defineUnit({
  id: 'ogs-recruit-token',
  name: 'Recruit',
  type: 'unit',
  cost: { energy: 0, power: {} },
  might: 1,
});
/** Quatre destinations choisies avant les réactions, base ou champs contrôlés. */
export const recruitTheVanguard = defineSpell({
  id: 'ogs-015-024',
  name: 'Recruit the Vanguard',
  type: 'spell',
  timing: 'action',
  cost: { energy: 6, power: {} },
  target: { kind: 'caster' },
  effects: [
    { type: 'summon-recruits', definitionId: recruitToken.id, count: 4 },
  ],
  text: '[Action] (Play on your turn or in showdowns.)\nPlay four 1 {might} Recruit unit tokens. (They can be played to your base or to battlefields you control.)',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/81d1c47459606f7b627778cce9b5f0e44d80f7fa-744x1039.png?accountingTag=RB',
});
