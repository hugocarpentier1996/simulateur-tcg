import { defineUnit } from '../unit-definition.js';
/** OGN-190 : Deathknell — 4 dégâts à toutes les unités du champ où il est mort. */
export const kogMaw = defineUnit({
  id: 'ogn-190-298',
  name: "Kog'Maw",
  type: 'unit',
  cost: { energy: 3, power: { violet: 1 } },
  might: 1,
  onDeath: { type: 'damage-here', amount: 4 },
  text: '[Deathknell] — Deal 4 to all units at my battlefield. (When I die, get the effect.)',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/1ba2b780619714f2bf97597a180f3b118f4faf55-744x1039.png?accountingTag=RB',
});
