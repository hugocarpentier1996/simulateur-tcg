import { defineUnit } from '../unit-definition.js';
/** OGN-194 : Ganking ; quand son propriétaire le voit en regardant le dessus de son deck
 * (sans le piocher), il peut le jouer pour 1 Power quelconque (Vision uniquement pour
 * l'instant). */
export const nocturne = defineUnit({
  id: 'ogn-194-298',
  name: 'Nocturne',
  type: 'unit',
  might: 4,
  cost: { energy: 4, power: { violet: 1 } },
  ganking: true,
  playWhenSeen: true,
  text: "[Ganking] (I can move from battlefield to battlefield.)\nWhen you look at cards from the top of your deck (and don't draw them) and see me, you may play me for {power:any}.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/19a751364bc6eb5297596e8733d0d30a1111ac78-744x1039.png?accountingTag=RB',
});
