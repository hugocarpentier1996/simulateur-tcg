import { defineBattlefield } from '../battlefield-definition.js';
/** OGN-291 : à la conquête ici, regarde les 2 cartes du dessus de son deck, en recycle 0 à 2
 * et remet les autres dans l'ordre choisi. */
export const theCandlelitSanctum = defineBattlefield({
  id: 'ogn-291-298',
  name: 'The Candlelit Sanctum',
  type: 'battlefield',
  conquerArrangeTop: 2,
  text: "When you conquer here, look at the top two cards of your Main Deck. You may recycle one or both of them. Put those you don't back in any order.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/f14fe78f2b7f3909eadb07bce24bd582e190653d-1038x744.png?accountingTag=RB',
});
