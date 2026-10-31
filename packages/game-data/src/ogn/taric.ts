import { defineUnit } from '../unit-definition.js';
/** OGN-074 : Shield, Tank ; les autres unités alliées ici ont Shield. */
export const taric = defineUnit({
  id: 'ogn-074-298',
  name: 'Taric',
  type: 'unit',
  cost: { energy: 4, power: { vert: 1 } },
  might: 4,
  shield: 1,
  tank: true,
  otherAlliesHereShield: 1,
  text: "[Shield] (+1 {might} while I'm a defender.)\n[Tank] (I must be assigned combat damage first.)\nOther friendly units here have [Shield].",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/7d08e3f64401cb87b8a0564a1cbe6fc94aee03a7-744x1039.png?accountingTag=RB',
});
