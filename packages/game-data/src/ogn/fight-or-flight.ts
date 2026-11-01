import { defineSpell } from '../spell-definition.js';
/** OGN-168 : Hidden ; Action ; déplace une unité d'un champ vers sa base. */
export const fightOrFlight = defineSpell({
  id: 'ogn-168-298',
  name: 'Fight or Flight',
  type: 'spell',
  timing: 'action',
  hidden: true,
  cost: { energy: 2, power: {} },
  target: { kind: 'unit', combatRole: 'any', zone: 'battlefield' },
  effects: [
    {
      type: 'move-unit',
      requiresReady: false,
      exhaustsUnit: false,
      baseOnly: true,
    },
  ],
  text: '[Hidden] (Hide now for {power:any} to react with later for {energy:0}.)\n[Action] (Play on your turn or in showdowns.)\nMove a unit from a battlefield to its base.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/2e7c7ad72889878e2dd5932d203814b185e74a87-744x1039.png?accountingTag=RB',
});
