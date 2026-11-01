import { defineSpell } from '../spell-definition.js';
/** OGN-213 : Hidden ; Action ; tue une unité sur un champ, son contrôleur pioche 2. */
export const hiddenBlade = defineSpell({
  id: 'ogn-213-298',
  name: 'Hidden Blade',
  type: 'spell',
  timing: 'action',
  hidden: true,
  cost: { energy: 2, power: { jaune: 1 } },
  target: { kind: 'unit', combatRole: 'any', zone: 'battlefield' },
  effects: [{ type: 'kill-unit', controllerDraws: 2 }],
  text: '[Hidden] (Hide now for {power:any} to react with later for {energy:0}.)\n[Action] (Play on your turn or in showdowns.)\nKill a unit at a battlefield. Its controller draws 2.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/0437ab8a0b67f43ef5483a103bbae9e57fd05822-744x1039.png?accountingTag=RB',
});
