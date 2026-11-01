import { defineGear } from '../gear-definition.js';
/** OGN-077 : Hidden ; la prochaine fois qu'une unité alliée devrait mourir, ce gear est
 * détruit à la place et l'unité est rappelée Tap dans sa base. */
export const zhonyasHourglass = defineGear({
  id: 'ogn-077-298',
  name: "Zhonya's Hourglass",
  type: 'gear',
  cost: { energy: 2, power: {} },
  effects: [],
  hidden: true,
  saveAllyFromDeath: true,
  text: "[Hidden] (Hide now for {power:any} to react with later for {energy:0}.)\nThe next time a friendly unit would die, kill this instead. Recall that unit exhausted. (Send it to base. This isn't a move.)",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/dc38172c56f838b407fc9f170ba973da32d7cd4d-744x1039.png?accountingTag=RB',
});
