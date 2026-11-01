import { defineSpell } from '../spell-definition.js';
/** OGN-057 : Hidden ; Action ; une unité gagne Shield 3 et Tank jusqu'à la fin du tour. */
export const block = defineSpell({
  id: 'ogn-057-298',
  name: 'Block',
  type: 'spell',
  timing: 'action',
  hidden: true,
  cost: { energy: 2, power: {} },
  target: { kind: 'unit', combatRole: 'any' },
  effects: [{ type: 'grant-shield-tank', shield: 3 }],
  text: "[Hidden] (Hide now for {power:any} to react with later for {energy:0}.)\n[Action] (Play on your turn or in showdowns.)\nGive a unit [Shield 3] and [Tank] this turn. (+3 {might} while it's a defender. It must be assigned combat damage first.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/36f7352e715fe073631ed85be41408c9a38ab865-744x1039.png?accountingTag=RB',
});
