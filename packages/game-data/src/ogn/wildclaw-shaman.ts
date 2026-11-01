import { defineUnit } from '../unit-definition.js';
/** OGN-147 : à la mise en jeu, peut dépenser le buff d'une unité alliée pour se buffer et se
 * redresser (cible facultative). */
export const wildclawShaman = defineUnit({
  id: 'ogn-147-298',
  name: 'Wildclaw Shaman',
  type: 'unit',
  cost: { energy: 4, power: {} },
  might: 3,
  onPlayTargetEffect: {
    allegiance: 'friendly',
    excludeSelf: true,
    buffed: true,
    optional: true,
    effect: { type: 'spend-buff-empower-self' },
  },
  text: "When you play me, you may spend a buff to buff me and ready me. (If I don't have a buff, I get a +1 {might} buff.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/7abc938fee4ba397f52c8ea60d350857a7517b0c-744x1039.png?accountingTag=RB',
});
