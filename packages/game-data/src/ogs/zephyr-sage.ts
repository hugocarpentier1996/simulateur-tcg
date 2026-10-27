import { defineUnit } from '../unit-definition.js';

/** OGS-005/024 — source : Proving Grounds/cartes.json. */
export const zephyrSage = defineUnit({
  id: 'ogs-005-024',
  name: 'Zephyr Sage',
  type: 'unit',
  cost: { energy: 6, power: { vert: 1 } },
  might: 6,
  shield: 1,
  text: "[Shield] (+1 {might} while I'm a defender.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/7664b03bb107954195153d9f2f86c5d63682fa4b-744x1039.png?accountingTag=RB',
});
