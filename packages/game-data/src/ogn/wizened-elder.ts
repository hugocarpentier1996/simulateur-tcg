import { defineUnit } from '../unit-definition.js';
/** OGN-065 : tant qu'il est buffé, +1 Might supplémentaire. */
export const wizenedElder = defineUnit({
  id: 'ogn-065-298',
  name: 'Wizened Elder',
  type: 'unit',
  cost: { energy: 4, power: {} },
  might: 4,
  buffedExtraMight: 1,
  text: "While I'm buffed, I have an additional +1 {might}.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/7b98797789ad7e3a6cf52126b82a42ec6f269bb7-744x1039.png?accountingTag=RB',
});
