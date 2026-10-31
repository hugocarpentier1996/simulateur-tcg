import { defineUnit } from '../unit-definition.js';
/** OGN-151 : Accelerate (Body) ; les autres unités alliées buffées de son champ ont +2 Might. */
export const leeSinBody = defineUnit({
  id: 'ogn-151-298',
  name: 'Lee Sin',
  type: 'unit',
  cost: { energy: 6, power: {} },
  might: 6,
  accelerate: { power: 'orange' },
  otherBuffedAlliesHereMight: 2,
  text: '[Accelerate] (You may pay {energy:1}{power:body} as an additional cost to have me enter ready.)\nOther buffed friendly units at my battlefield have +2 {might}.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/eca1aec1304de9c237751eb0aeed620b9ad0408e-744x1039.png?accountingTag=RB',
});
