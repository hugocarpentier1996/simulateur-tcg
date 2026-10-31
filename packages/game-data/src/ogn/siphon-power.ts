import { defineSpell } from '../spell-definition.js';
/** OGN-266 : Réaction ; sur un champ, alliés +1 Might et ennemis -1 (minimum 1) ce tour. */
export const siphonPower = defineSpell({
  id: 'ogn-266-298',
  name: 'Siphon Power',
  type: 'spell',
  timing: 'reaction',
  cost: { energy: 2, power: { bleu: 1 } },
  target: { kind: 'battlefield' },
  effects: [
    {
      type: 'modify-battlefield-sides',
      friendly: 1,
      enemy: -1,
      minimum: 1,
    },
  ],
  text: '[Reaction] (Play any time, even before spells and abilities resolve.)\nChoose a battlefield. Give friendly units there +1 {might} this turn and enemy units there -1 {might} this turn, to a minimum of 1 {might}.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/b449170ba312711c82708d1fea2b044822ce5eaa-744x1039.png?accountingTag=RB',
});
