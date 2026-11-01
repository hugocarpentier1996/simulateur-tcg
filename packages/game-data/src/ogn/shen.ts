import { defineUnit } from '../unit-definition.js';
/** OGN-241 : unité Réaction (jouable à tout moment avec la priorité) ; Shield 2 ; Tank. */
export const shen = defineUnit({
  id: 'ogn-241-298',
  name: 'Shen',
  type: 'unit',
  might: 3,
  cost: { energy: 3, power: { jaune: 1 } },
  reactionTiming: true,
  shield: 2,
  tank: true,
  text: "[Reaction] (Play any time, even before spells and abilities resolve, including to a battlefield you control.)\n[Shield 2] (+2 {might} while I'm a defender.)\n[Tank] (I must be assigned combat damage first.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/25f3a9fa33201278ebf475b2d02dae8c0c0cb20c-744x1039.png?accountingTag=RB',
});
