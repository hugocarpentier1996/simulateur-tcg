import { defineUnit } from '../unit-definition.js';

/** OGS-016/024 — source : Proving Grounds/cartes.json. */
export const vanguardAttendant = defineUnit({
  id: 'ogs-016-024',
  name: 'Vanguard Attendant',
  type: 'unit',
  cost: { energy: 6, power: { jaune: 1 } },
  might: 5,
  entersReady: true,
  text: 'I enter ready.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/4ce467c1d51a65ab4fbae918dca38ae90b510844-744x1039.png?accountingTag=RB',
});
