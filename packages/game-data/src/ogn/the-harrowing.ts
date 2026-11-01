import { defineSpell } from '../spell-definition.js';
/** OGN-198 : joue une unité de son cimetière dans sa base, sans son coût en énergie (son
 * Power est payé avec le sort, hypothèse). */
export const theHarrowing = defineSpell({
  id: 'ogn-198-298',
  name: 'The Harrowing',
  type: 'spell',
  timing: 'normal',
  cost: { energy: 6, power: { violet: 2 } },
  target: { kind: 'graveyard-unit' },
  effects: [{ type: 'play-from-trash' }],
  text: 'Play a unit from your trash, ignoring its Energy cost. (You must still pay its Power cost.)',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/6914034f56dd50ab37df26e3541c997479bb5a6d-744x1039.png?accountingTag=RB',
});
