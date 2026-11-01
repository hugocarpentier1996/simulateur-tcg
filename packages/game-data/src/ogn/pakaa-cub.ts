import { defineUnit } from '../unit-definition.js';
/** OGN-135 : Hidden (cachée pour 1 Power, jouée gratuitement plus tard sur son champ). */
export const pakaaCub = defineUnit({
  id: 'ogn-135-298',
  name: 'Pakaa Cub',
  type: 'unit',
  might: 3,
  cost: { energy: 3, power: {} },
  hidden: true,
  text: '[Hidden] (Hide now for {power:any} to react with later for {energy:0}.)',
  imageUrl:
    'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/156a66d7d44165367cc5a470fb35c86f337f9429-744x1039.png?accountingTag=RB',
});
