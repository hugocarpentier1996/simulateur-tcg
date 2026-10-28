import { defineUnit } from '../unit-definition.js';
export const wielderOfWater = defineUnit({
  id: 'ogn-055-298',
  name: 'Wielder of Water',
  type: 'unit',
  cost: { energy: 3, power: {} },
  might: 2,
  aloneCombatMightBonus: 2,
  text: "While I'm attacking or defending alone, I have +2 {might}.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/5b38a7758705bd739caf07b5c0c49482a4a23015-744x1039.png?accountingTag=RB',
});
