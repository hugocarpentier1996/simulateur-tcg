import type { GameState } from '../types.js';
import type { LegendEntry } from '../legend-types.js';
import { activeLegends } from './legends.js';
import {
  expensiveSpellTriggers,
  type SpellPlayEntry,
} from './expensive-spell.js';

/** Sort résolu (« joué » = validé et non contré, règle utilisateur) -> déclenchements
 * « When you play a spell » du lanceur, calculés à cet instant sur le coût imprimé.
 * Ordre d'empilement : capacités d'unités puis légende, qui se résout donc en premier.
 * Un sort retiré de la pile sans résolution ne passe jamais par ici. */
export function spellPlayedTriggers(
  state: GameState,
  casterId: string,
  printedEnergy: number,
): (SpellPlayEntry | LegendEntry)[] {
  const legendDraws = activeLegends(state, casterId).flatMap(
    ({ card, definition }) =>
      definition.spellDraw &&
      printedEnergy >= definition.spellDraw.minimumEnergy
        ? [
            {
              kind: 'legend-draw' as const,
              sourceId: card.id,
              ownerId: casterId,
              count: definition.spellDraw.count,
            },
          ]
        : [],
  );
  return [
    ...expensiveSpellTriggers(state, casterId, printedEnergy),
    ...legendDraws,
  ];
}
