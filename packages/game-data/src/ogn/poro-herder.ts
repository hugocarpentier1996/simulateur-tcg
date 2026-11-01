import { defineUnit } from '../unit-definition.js';
/** OGN-061 : à la mise en jeu, s'il contrôle un Poro, se buffe et pioche 1. */
export const poroHerder = defineUnit({
  id: 'ogn-061-298',
  name: 'Poro Herder',
  type: 'unit',
  cost: { energy: 3, power: { vert: 1 } },
  might: 3,
  onPlayEffect: { type: 'buff-self', ifControlTag: 'Poro', draw: 1 },
  text: "When you play me, if you control a Poro, buff me and draw 1. (If I don't have a buff, I get a +1 {might} buff.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/166b718a8517fcceac7e7d4f6acbc4fa0bbc2c55-744x1039.png?accountingTag=RB',
});
