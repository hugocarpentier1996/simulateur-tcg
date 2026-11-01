import { defineUnit } from '../unit-definition.js';
/** OGN-230 : à la mise en jeu, dépense des buffs alliés choisis ; 1 rune Tap canalisée par buff. */
export const albusFerros = defineUnit({
  id: 'ogn-230-298',
  name: 'Albus Ferros',
  type: 'unit',
  might: 3,
  cost: { energy: 4, power: {} },
  onPlaySpendBuffsChannel: true,
  text: 'When you play me, spend any number of buffs. For each buff spent, channel 1 rune exhausted.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/ec0be8d2a79196b689fccf9ee42ce8baa7e9c35e-744x1039.png?accountingTag=RB',
});
