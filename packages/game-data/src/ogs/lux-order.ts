import { defineUnit } from '../unit-definition.js';

/** OGS-014/024 : ADD immédiat, énergie exclusivement réservée aux sorts. */
export const luxOrder = defineUnit({
  id: 'ogs-014-024',
  name: 'Lux',
  type: 'unit',
  cost: { energy: 4, power: {} },
  might: 2,
  spellEnergyAbility: 2,
  text: '{exhaust}: [Reaction] — [Add] {energy:2}. Use only to play spells. (Abilities that add resources can’t be reacted to.)',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/17d0793ad495727e67bb1c94ae0e11cd4705870f-744x1039.png?accountingTag=RB',
});
