import { defineUnit } from '../unit-definition.js';

/** OGS-007/024 — version Body, distincte de Garen Order OGS-013. */
export const garenBody = defineUnit({
  id: 'ogs-007-024',
  name: 'Garen',
  type: 'unit',
  cost: { energy: 6, power: { orange: 1 } },
  might: 5,
  shield: 2,
  assault: 2,
  text: "[Assault 2], [Shield 2] (+2 {might} while I'm an attacker or defender.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/67c22dc29a7a28dabe0f169a7848c25bef1fbda4-744x1039.png?accountingTag=RB',
});
