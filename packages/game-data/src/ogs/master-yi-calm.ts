import { defineUnit } from '../unit-definition.js';

/** OGS-004/024 — version Calm, distincte de la version Body. */
export const masterYiCalm = defineUnit({
  id: 'ogs-004-024',
  name: 'Master Yi',
  type: 'unit',
  cost: { energy: 5, power: { vert: 1 } },
  might: 4,
  runeMightBonus: { minimum: 8, amount: 4 },
  text: 'While you have 8+ runes, I have +4 {might}.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/5508566c8f05f09492148faa803332a731095eb7-744x1039.png?accountingTag=RB',
});
