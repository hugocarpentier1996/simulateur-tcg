import { defineUnit } from '../unit-definition.js';
/** OGN-096 : Deathknell — son propriétaire pioche 1. */
export const watchfulSentry = defineUnit({
  id: 'ogn-096-298',
  name: 'Watchful Sentry',
  type: 'unit',
  cost: { energy: 2, power: {} },
  might: 1,
  onDeath: { type: 'draw', count: 1 },
  text: '[Deathknell] — Draw 1. (When I die, get the effect.)',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/d84da2c62b1e218a0a74b227c49ce8a953918ebd-744x1039.png?accountingTag=RB',
});
