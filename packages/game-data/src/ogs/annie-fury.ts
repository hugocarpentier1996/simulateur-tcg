import { defineUnit } from '../unit-definition.js';

/** OGS-001/024 — Fury : bonus aux sorts/capacités, jamais aux dégâts directs d'unités. */
export const annieFury = defineUnit({
  id: 'ogs-001-024',
  name: 'Annie',
  type: 'unit',
  cost: { energy: 5, power: { rouge: 1 } },
  might: 4,
  spellAbilityDamageBonus: 1,
  text: 'Your spells and abilities deal 1 Bonus Damage. (Each instance of damage the spell deals is increased by 1.)',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/532d75dc36a16eb5954253a77366fcceac7aec62-744x1039.png?accountingTag=RB',
});
