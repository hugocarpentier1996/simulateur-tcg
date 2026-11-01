import { defineUnit } from '../unit-definition.js';
/** OGN-197 : Hidden ; à la mise en jeu, +3 Might jusqu'à la fin du tour. */
export const teemoChaos = defineUnit({
  id: 'ogn-197-298',
  name: 'Teemo',
  type: 'unit',
  might: 1,
  cost: { energy: 2, power: {} },
  hidden: true,
  onPlayEffect: { type: 'self-might', amount: 3 },
  text: '[Hidden] (Hide now for {power:any} to react with later for {energy:0}.)\nWhen you play me, give me +3 {might} this turn.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/ca8a2e11dd78dd09ad1c9ad3a23e5699254b947e-744x1039.png?accountingTag=RB',
});
