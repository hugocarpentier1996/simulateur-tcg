import { defineSpell } from '../spell-definition.js';
/** OGN-104 : Réaction ; renvoie une unité alliée dans la main de son propriétaire, qui
 * canalise 1 rune Tap. */
export const retreat = defineSpell({
  id: 'ogn-104-298',
  name: 'Retreat',
  type: 'spell',
  timing: 'reaction',
  cost: { energy: 1, power: {} },
  target: { kind: 'unit', combatRole: 'any', allegiance: 'friendly' },
  effects: [
    { type: 'return-unit-to-hand' },
    { type: 'channel-exhausted', count: 1 },
  ],
  text: "[Reaction] (Play any time, even before spells and abilities resolve.)\nReturn a friendly unit to its owner's hand. Its owner channels 1 rune exhausted.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/71ecf6c06d3110a81ac0f01c726c06921f479a13-744x1039.png?accountingTag=RB',
});
