import { defineBattlefield } from '../battlefield-definition.js';
/** OGN-285 : quand son contrôleur y défend, il peut renvoyer une unité alliée d'ici dans sa
 * base (via la pile, choix à la résolution). */
export const reaversRow = defineBattlefield({
  id: 'ogn-285-298',
  name: "Reaver's Row",
  type: 'battlefield',
  defendRetreat: true,
  text: 'When you defend here, you may move a friendly unit here to base.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/7d99fe84c9b815463198b5dbad694759940cac12-1038x744.png?accountingTag=RB',
});
