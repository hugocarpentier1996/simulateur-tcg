import { defineUnit } from '../unit-definition.js';
/** OGN-091 : quand son propriétaire joue un gear, il se redresse. */
export const pitCrew = defineUnit({
  id: 'ogn-091-298',
  name: 'Pit Crew',
  type: 'unit',
  cost: { energy: 3, power: {} },
  might: 3,
  readyOnGearPlayed: true,
  text: 'When you play a gear, ready me.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/8023223b55adc44bafe1f8c5f305d3dde6f6d114-744x1039.png?accountingTag=RB',
});
