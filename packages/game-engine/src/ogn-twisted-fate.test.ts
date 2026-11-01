import { expect, it } from 'vitest';
import { spellScenario, step, resolveTop } from './origins-test-fixtures.js';
import { twistedFate, stupefy } from '../../game-data/src/index.js';

function attack(color: string) {
  const s0 = spellScenario(stupefy);
  s0.unitDefinitions = [twistedFate];
  s0.units = [
    {
      ...s0.units[0]!,
      id: 'tf',
      definitionId: twistedFate.id,
      zoneId: 'base-a',
      might: 4,
    },
    { ...s0.units[1]!, might: 5 },
    { ...s0.units[1]!, id: 'enemy2', might: 5 },
  ];
  s0.cards.push(
    {
      id: 'rune-top',
      definitionId: 'rune',
      ownerId: 'a',
      zoneId: 'rune-pile-a',
      color,
    },
    {
      id: 'rune-next',
      definitionId: 'rune',
      ownerId: 'a',
      zoneId: 'rune-pile-a',
      color: 'vert',
    },
  );
  let s = step(s0, {
    type: 'move',
    playerId: 'a',
    unitId: 'tf',
    destinationId: 'g',
  });
  while (s.stack && !s.pendingModeChoice) s = resolveTop(s);
  return s;
}

it('Twisted Fate : rune Fury -> 2 dégâts à un ennemi ici et 1 aux autres ennemis ici', () => {
  let s = attack('rouge');
  const pile = s.cards
    .filter((c) => c.zoneId === 'rune-pile-a')
    .map((c) => c.id);
  expect(pile).toEqual(['rune-next', 'rune-top']);
  expect(s.pendingModeChoice?.modes).toEqual([
    'tf-fury:enemy',
    'tf-fury:enemy2',
  ]);
  s = step(s, { type: 'choose-mode', playerId: 'a', mode: 'tf-fury:enemy2' });
  expect(s.units.find((u) => u.id === 'enemy2')?.damage).toBe(2);
  expect(s.units.find((u) => u.id === 'enemy')?.damage).toBe(1);
});

it('Twisted Fate : rune Mind -> pioche 1 ; rune Order -> étourdit un ennemi', () => {
  const mind = attack('bleu');
  expect(mind.cards.find((c) => c.id === 'draw-a-0')?.zoneId).toBe('hand-a');
  let order = attack('jaune');
  expect(order.pendingModeChoice?.modes).toEqual(['stun:enemy', 'stun:enemy2']);
  order = step(order, {
    type: 'choose-mode',
    playerId: 'a',
    mode: 'stun:enemy',
  });
  expect(
    order.units.find((u) => u.id === 'enemy')?.temporaryEffects,
  ).toContainEqual({ type: 'stun' });
});
