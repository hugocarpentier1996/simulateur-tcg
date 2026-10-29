import * as data from '../../../packages/game-data/src/index.js';
import { createGame } from '../../../packages/game-engine/src/index.js';
import type { GameConfig } from '../../../packages/game-engine/src/setup/create-game.js';
import { shuffle } from '../../../packages/game-engine/src/random/shuffle.js';
import { starterDeckLists } from './starter-deck-lists.js';
import { prepareDemo, type Session } from './session.js';

const values = Object.values(data);
const units = values.filter(
  (v): v is data.UnitDefinition =>
    typeof v === 'object' && 'type' in v && v.type === 'unit',
);
const spells = values.filter(
  (v): v is data.SpellDefinition =>
    typeof v === 'object' && 'type' in v && v.type === 'spell',
);
const runes = values.filter(
  (v): v is data.RuneDefinition =>
    typeof v === 'object' && 'type' in v && v.type === 'rune',
);
const fields = values.filter(
  (v): v is data.BattlefieldDefinition =>
    typeof v === 'object' && 'type' in v && v.type === 'battlefield',
);
const legends = [
  data.darkChild,
  data.mightOfDemacia,
  data.ladyOfLuminosity,
  data.wujuBladesman,
];
export const starterChampions = [
  data.annieFury,
  data.annieChaos,
  data.garenBody,
  data.garenOrder,
  data.luxMind,
  data.luxOrder,
  data.masterYiBody,
  data.masterYiCalm,
];
const cards = [...units, ...spells, ...runes, ...fields];
const legendNames = [
  'Annie, Dark Child',
  'Garen, Might of Demacia',
  'Lux, Lady of Luminosity',
  'Master Yi, Wuju Bladesman',
];
const normalize = (s: string) => s.replaceAll('’', "'").toLowerCase();
/** Graine uint32 -> deux decks choisis indépendamment parmi les quatre listes fournies.
 * Retire une copie d'un Champion partageant un tag avec la légende, puis mélange
 * les 39 cartes et les 12 runes avant toute pioche. Une graine identique reproduit tout.
 * Refuse les noms inconnus et les listes invalides ; le battlefield fourni est imposé en BO1.
 */
export function starterConfig(seed: number): GameConfig {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff)
    throw new Error('Graine uint32 requise');
  let current = seed;
  function mix<T>(items: readonly T[]): T[] {
    const result = shuffle(items, current);
    current = result.seed;
    return result.items;
  }
  const players = ['a', 'b'].map((id) => {
    const list = mix(starterDeckLists)[0]!;
    const legend = legends[legendNames.indexOf(list.Legend[0].name)]!;
    if (!legend) throw new Error('Légende inconnue');
    function expand(
      entries: readonly { name: string; count: number }[],
      prefix: string,
    ) {
      return entries.flatMap((e) => {
        const definition = cards.find(
          (c) =>
            normalize(c.displayName ?? c.name) === normalize(e.name) ||
            normalize(c.name) === normalize(e.name),
        );
        if (!definition) throw new Error(`Carte inconnue : ${e.name}`);
        return Array.from({ length: e.count }, (_, i) => ({
          id: `${id}-${prefix}-${definition.id}-${i}`,
          definitionId: definition.id,
          ...(definition.type === 'rune' ? { color: definition.color } : {}),
        }));
      });
    }
    const full = expand(list['Main Deck'], 'card');
    if (full.length !== 40)
      throw new Error(
        'Le deck doit contenir 40 cartes avant choix du champion',
      );
    const candidates = full.filter((c) => {
      const u = units.find((u) => u.id === c.definitionId);
      return (
        u &&
        starterChampions.some((c) => c.id === u.id) &&
        u.tags?.some((t) => t !== 'Champion' && legend.tags?.includes(t))
      );
    });
    const champion = mix(candidates)[0];
    if (!champion) throw new Error('Aucun champion approprié');
    return {
      id,
      deck: mix(full.filter((c) => c.id !== champion.id)),
      champion,
      runes: mix(expand(list.Runes, 'rune')),
      legend: {
        id: `${id}-legend`,
        definitionId: legend.id,
        colors: legend.colors,
      },
      battlefields: expand(list.Battlefields, 'field'),
    };
  });
  return {
    players,
    randomState: current,
    battlefieldSelection: 'provided',
    unitDefinitions: units,
    spellDefinitions: spells,
    legendDefinitions: legends,
    battlefieldDefinitions: fields,
  };
}
/** Graine fournie par l'appelant -> session BO1 mélangée, quatre cartes puis pioche du tour.
 * Dés de démonstration 19/8 et aucun mulligan ; aucun hasard global dans cette fonction. */
export function createStarterSession(seed: number): Session {
  const config = starterConfig(seed);
  const result = createGame(config);
  if (!result.ok) throw new Error(result.reason);
  return {
    state: prepareDemo(result.state),
    history: [],
    error: null,
    log: [
      'Decks Proving Grounds tirés au sort ; champions choisis, decks et runes mélangés.',
      ...config.players.map(
        (p) =>
          `${p.id === 'a' ? 'Joueur 1' : 'Joueur 2'} : ${legends.find((l) => l.id === p.legend.definitionId)!.name}`,
      ),
      'Dés de démonstration 19 / 8, aucun mulligan.',
    ],
  };
}
