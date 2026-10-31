import { defineUnit } from '../unit-definition.js';
/** OGN-110 : Accelerate (Mind) ; Deathknell — se recycle pour redresser ses runes. */
export const ekko = defineUnit({
  id: 'ogn-110-298',
  name: 'Ekko',
  type: 'unit',
  cost: { energy: 5, power: { bleu: 1 } },
  might: 5,
  accelerate: { power: 'bleu' },
  onDeath: { type: 'recycle-self-ready-runes' },
  text: '[Accelerate] (You may pay {energy:1}{power:mind} as an additional cost to have me enter ready.)\n[Deathknell] — Recycle me to ready your runes. (When I die, get the effect.)',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/65da19325b6def53d33c07bc1aa8f91fd2f1e723-744x1039.png?accountingTag=RB',
});
