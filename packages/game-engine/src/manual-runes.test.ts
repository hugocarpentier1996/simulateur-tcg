import { expect, it } from 'vitest';
import { spellScenario, step, noRunes } from './origins-test-fixtures.js';
import { act } from './act.js';
import { incinerate } from '../../game-data/src/index.js';
import type { GameState } from './types.js';

/** Table de sort avec deux runes en jeu et une rune dans la pile du Joueur 1. */
function withRunes(): GameState {
  const s = spellScenario(incinerate);
  s.resources = { a: { energy: 0, power: {} }, b: { energy: 0, power: {} } };
  s.cards.push(
    {
      id: 'r1',
      definitionId: 'rune',
      ownerId: 'a',
      zoneId: 'runes-a',
      color: 'rouge',
      ready: true,
    },
    {
      id: 'r2',
      definitionId: 'rune',
      ownerId: 'a',
      zoneId: 'runes-a',
      color: 'bleu',
      ready: false,
    },
    {
      id: 'p1',
      definitionId: 'rune',
      ownerId: 'a',
      zoneId: 'rune-pile-a',
      color: 'rouge',
    },
  );
  return s;
}

it('Tap une rune Ready ajoute 1 énergie à la réserve', () => {
  const s = step(withRunes(), {
    type: 'tap-rune',
    playerId: 'a',
    runeId: 'r1',
  });
  expect(s.resources.a).toEqual({ energy: 1, power: {} });
  expect(s.cards.find((c) => c.id === 'r1')!.ready).toBe(false);
  expect(act(s, { type: 'tap-rune', playerId: 'a', runeId: 'r1' })).toEqual({
    ok: false,
    reason: 'RUNE_NOT_READY',
  });
});

it('recycle une rune Tap sous le deck de runes pour 1 Power de sa couleur', () => {
  const s = step(withRunes(), {
    type: 'recycle-rune',
    playerId: 'a',
    runeId: 'r2',
  });
  expect(s.resources.a).toEqual({ energy: 0, power: { bleu: 1 } });
  const pile = s.cards.filter((c) => c.zoneId === 'rune-pile-a');
  expect(pile.map((c) => c.id)).toEqual(['p1', 'r2']);
});

it('recycle une rune Ready pour 1 énergie et 1 Power', () => {
  const s = step(withRunes(), {
    type: 'recycle-rune',
    playerId: 'a',
    runeId: 'r1',
  });
  expect(s.resources.a).toEqual({ energy: 1, power: { rouge: 1 } });
});

it('la réserve manuelle paie ensuite un sort sans autre rune', () => {
  let s = step(withRunes(), { type: 'tap-rune', playerId: 'a', runeId: 'r1' });
  s = step(s, { type: 'recycle-rune', playerId: 'a', runeId: 'r2' });
  expect(s.resources.a!.energy).toBe(1);
  s.resources.a = { energy: 2, power: {} };
  s = step(s, {
    type: 'cast-spell',
    playerId: 'a',
    cardId: 'spell',
    targetId: 'enemy',
    payment: noRunes,
  });
  expect(s.resources.a!.energy).toBe(0);
  expect(s.stack?.entries).toHaveLength(1);
});

it('refuse les runes adverses, hors zone ou sans priorité, sans modifier l’état', () => {
  const s = withRunes();
  for (const action of [
    { type: 'tap-rune', playerId: 'b', runeId: 'r1' },
    { type: 'tap-rune', playerId: 'a', runeId: 'p1' },
    { type: 'recycle-rune', playerId: 'a', runeId: 'spell' },
  ] as const)
    expect(act(s, action).ok).toBe(false);
  const waiting = { ...s, activePlayerId: 'b' };
  expect(
    act(waiting, { type: 'tap-rune', playerId: 'a', runeId: 'r1' }).ok,
  ).toBe(false);
});
