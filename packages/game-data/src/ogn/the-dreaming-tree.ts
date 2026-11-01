import { defineBattlefield } from '../battlefield-definition.js';
/** OGN-292 : la première fois chaque tour qu'un joueur choisit avec un sort une unité alliée
 * présente ici, il pioche 1. */
export const theDreamingTree = defineBattlefield({
  id: 'ogn-292-298',
  name: 'The Dreaming Tree',
  type: 'battlefield',
  drawOnFirstFriendlySpellChoice: true,
  text: 'When a player chooses a friendly unit here with a spell for the first time each turn, they draw 1.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/f382c2c2442959f2a8905de2be7d202458918a04-1040x744.png?accountingTag=RB',
});
