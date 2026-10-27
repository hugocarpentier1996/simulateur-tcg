import { defineSpell } from '../spell-definition.js';

/** OGS-008/024 : deux cibles choisies au lancement, bonus avant dégâts réciproques. */
export const gentlemensDuel = defineSpell({
  id: 'ogs-008-024',
  name: "Gentlemen's Duel",
  type: 'spell',
  timing: 'action',
  cost: { energy: 6, power: { orange: 1 } },
  target: { kind: 'unit', combatRole: 'any', allegiance: 'friendly' },
  effects: [
    { type: 'modify-might', amount: 3, duration: 'end-of-turn' },
    { type: 'duel' },
  ],
  text: '[Action] (Play on your turn or in showdowns.)\nGive a friendly unit +3 {might} this turn. Then choose an enemy unit. They deal damage equal to their Mights to each other.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/4568ab827fdcd42d6bb86b1c2de6182e286c9ee9-744x1039.png?accountingTag=RB',
});
