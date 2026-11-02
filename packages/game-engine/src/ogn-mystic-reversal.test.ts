import { expect, it } from 'vitest';
import type { GameState } from './types.js';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import {
  mysticReversal,
  hextechRay,
  poutyPoro,
  fallingStar,
} from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(mysticReversal);
  s.resources.a = { energy: 4, power: { vert: 3 } };
  s.activePlayerId = 'b';
  s.spellDefinitions = [mysticReversal, hextechRay];
  s.stack = {
    entries: [
      {
        card: {
          id: 'ray',
          definitionId: hextechRay.id,
          ownerId: 'b',
          zoneId: 'hand-b',
        },
        definition: hextechRay,
        casterId: 'b',
        targetId: 'enemy',
      },
    ],
    initiatorId: 'b',
    priorityPlayerId: 'a',
    consecutivePasses: 0,
  };
  return s;
}

const targets = (s: GameState) =>
  (s.pendingModeChoice?.castOptions ?? []).map((o) => o.targetId);
const pick = (s: GameState, id: string) =>
  `cast-option:${targets(s).indexOf(id)}` as const;

it('Mystic Reversal : prend le contrôle d’un sort de la pile, qui peut garder ses cibles', () => {
  const s = scenario();
  let after = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'ray',
      payment: noRunes,
    }),
  );
  expect(after.stack?.entries[0]).toMatchObject({ casterId: 'a' });
  expect(targets(after)).toEqual(['ally']);
  after = resolveTop(
    step(after, { type: 'choose-mode', playerId: 'a', mode: 'skip' }),
  );
  expect(after.units.some((u) => u.id === 'enemy')).toBe(false);
  expect(after.cards.find((c) => c.id === 'ray')?.zoneId).toBe('graveyard-b');
});

it('Mystic Reversal : « you may make new choices » — nouvelle cible valide au choix', () => {
  const s = scenario();
  s.units.push({ ...s.units[1]!, id: 'enemy2' });
  let after = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'ray',
      payment: noRunes,
    }),
  );
  expect(targets(after)).toEqual(['ally', 'enemy2']);
  after = step(after, {
    type: 'choose-mode',
    playerId: 'a',
    mode: pick(after, 'enemy2'),
  });
  after = resolveTop(after);
  expect(after.units.some((u) => u.id === 'enemy2')).toBe(false);
  expect(after.units.some((u) => u.id === 'enemy')).toBe(true);
});

it('Mystic Reversal : une nouvelle cible Deflect impose sa taxe au voleur (proposée seulement si payable)', () => {
  const base = () => {
    const s = scenario();
    s.unitDefinitions = [poutyPoro];
    s.units.push({ ...s.units[1]!, id: 'poro', definitionId: poutyPoro.id });
    return s;
  };
  const cast = {
    type: 'cast-spell' as const,
    playerId: 'a',
    cardId: 'spell',
    targetId: 'ray',
    payment: noRunes,
  };
  const poor = resolveTop(step(base(), cast));
  expect(targets(poor)).not.toContain('poro');
  const rich = base();
  rich.resources.a = { energy: 4, power: { vert: 4 } };
  let s = resolveTop(step(rich, cast));
  expect(targets(s)).toContain('poro');
  s = step(s, { type: 'choose-mode', playerId: 'a', mode: pick(s, 'poro') });
  expect(s.resources.a?.power.vert).toBe(0);
  s = resolveTop(s);
  expect(s.units.some((u) => u.id === 'poro')).toBe(false);
});

it('Mystic Reversal : tous les choix du sort volé peuvent être refaits (sélection de Falling Star)', () => {
  const s = scenario();
  s.spellDefinitions = [mysticReversal, fallingStar];
  s.units = s.units.map((u) => ({ ...u, might: 9 }));
  s.stack!.entries = [
    {
      card: {
        id: 'star',
        definitionId: fallingStar.id,
        ownerId: 'b',
        zoneId: 'hand-b',
      },
      definition: fallingStar,
      casterId: 'b',
      targetId: 'b',
      selectedUnitIds: ['ally', 'ally'],
    },
  ];
  let after = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'star',
      payment: noRunes,
    }),
  );
  const options = after.pendingModeChoice?.castOptions ?? [];
  const index = options.findIndex(
    (o) => o.selectedUnitIds?.join() === 'enemy,enemy',
  );
  expect(index).toBeGreaterThanOrEqual(0);
  after = step(after, {
    type: 'choose-mode',
    playerId: 'a',
    mode: `cast-option:${index}`,
  });
  expect(after.stack?.entries).toHaveLength(1);
  after = resolveTop(after);
  expect(after.units.find((u) => u.id === 'enemy')?.damage).toBe(6);
  expect(after.units.find((u) => u.id === 'ally')?.damage).toBe(0);
});
