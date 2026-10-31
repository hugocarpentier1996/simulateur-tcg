import { defineUnit } from '../unit-definition.js';
/** OGN-232 : Mighty (5+ Might) -> Deflect, Ganking et Shield. */
export const fiora = defineUnit({
  id: 'ogn-232-298',
  name: 'Fiora',
  type: 'unit',
  cost: { energy: 4, power: {} },
  might: 4,
  mightyKeywords: true,
  text: "While I'm [Mighty], I have [Deflect], [Ganking], and [Shield]. (I'm Mighty while I have 5+ {might}.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/24d4d1997e6a5b145412e402fc69399d590ecda0-744x1039.png?accountingTag=RB',
});
