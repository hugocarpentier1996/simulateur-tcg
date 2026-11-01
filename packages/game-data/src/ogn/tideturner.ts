import { defineUnit } from '../unit-definition.js';
/** OGN-199 : Hidden ; joué, il peut échanger sa place avec une unité alliée (exception :
 * depuis Hidden, l'alliée peut être hors de son champ). */
export const tideturner = defineUnit({
  id: 'ogn-199-298',
  name: 'Tideturner',
  type: 'unit',
  might: 2,
  cost: { energy: 2, power: {} },
  hidden: true,
  onPlayTargetEffect: {
    optional: true,
    allegiance: 'friendly',
    excludeSelf: true,
    effect: { type: 'swap-places' },
  },
  text: '[Hidden] (Hide now for {power:any} to react with later for {energy:0}.)\nWhen you play me, you may choose a friendly unit. Move me to its location and it to my original location.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/bad355dba8b32d1fba33dc3924cad6a34b61b5af-744x1039.png?accountingTag=RB',
});
