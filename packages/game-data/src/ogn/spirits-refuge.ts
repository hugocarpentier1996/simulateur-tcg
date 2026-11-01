import { defineGear } from '../gear-definition.js';
/** OGN-063 : posé, buffe une unité alliée choisie ; les unités alliées buffées ont Deflect. */
export const spiritsRefuge = defineGear({
  id: 'ogn-063-298',
  name: "Spirit's Refuge",
  type: 'gear',
  cost: { energy: 2, power: { vert: 1 } },
  effects: [],
  onPlayBuffAlly: true,
  buffedAlliesDeflect: true,
  text: "When you play this, buff a friendly unit. (If it doesn't have a buff, it gets a +1 {might} buff.)\nFriendly buffed units have [Deflect] if they didn't already. (Opponents must pay {power:any} to choose those units with a spell or ability.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/26d5e54580d1f17ed6c35a66ac6a90ce56c99ec8-744x1039.png?accountingTag=RB',
});
