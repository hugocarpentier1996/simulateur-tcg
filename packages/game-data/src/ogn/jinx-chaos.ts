import { defineUnit } from '../unit-definition.js';
/** OGN-202 : quand son propriétaire défausse une ou plusieurs cartes, se redresse et
 * gagne +1 Might ce tour. */
export const jinxChaos = defineUnit({
  id: 'ogn-202-298',
  name: 'Jinx',
  type: 'unit',
  cost: { energy: 5, power: { violet: 1 } },
  might: 5,
  onOwnerDiscard: { might: 1, ready: true },
  text: 'When you discard one or more cards, ready me and give me +1 {might} this turn.',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/a7fe105f40df66525be51bd18e25506945a7b027-744x1039.png?accountingTag=RB',
});
