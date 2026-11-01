import { defineUnit } from '../unit-definition.js';
/** OGN-035 : Assault 3 ; entre Ready si un adversaire contrôle un champ ; à la conquête,
 * peut payer 1 énergie pour retourner dans la main de son propriétaire. */
export const vayne = defineUnit({
  id: 'ogn-035-298',
  name: 'Vayne',
  type: 'unit',
  might: 2,
  cost: { energy: 4, power: { rouge: 1 } },
  assault: 3,
  entersReadyIfOpponentControls: true,
  onConquerPayReturn: true,
  text: "[Assault 3] (+3 {might} while I'm an attacker.)\nIf an opponent controls a battlefield, I enter ready.\nWhen I conquer, you may pay {energy:1} to return me to my owner's hand.",
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/b38a22e6f4bfaa8589f32754a7466fe5214e81b5-744x1039.png?accountingTag=RB',
});
