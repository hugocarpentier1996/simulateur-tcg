import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
  drain,
} from './origins-test-fixtures.js';
import { theBoss, hextechRay } from '../../game-data/src/index.js';
import { queueConquestLegends } from './effects/conquest-legends.js';

function scenario(power: number) {
  const s = spellScenario(hextechRay);
  s.legendDefinitions = [theBoss];
  s.zones.push({ id: 'legend-b', kind: 'legend', ownerId: 'b' });
  s.cards.push({
    id: 'boss',
    definitionId: theBoss.id,
    ownerId: 'b',
    zoneId: 'legend-b',
    ready: true,
  });
  s.units[1] = { ...s.units[1]!, might: 2, buffed: true };
  s.resources.a = { energy: 1, power: { rouge: 1 } };
  s.resources.b = { energy: 0, power: power ? { orange: power } : {} };
  return resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'enemy',
      payment: noRunes,
    }),
  );
}

it('The Boss : « you may » payant demandé ; accepté, l’unité buffée dépense son buff et est rappelée Tap', () => {
  let s = scenario(1);
  expect(s.pendingModeChoice).toMatchObject({
    ownerId: 'b',
    modes: ['skip', 'accept'],
  });
  expect(s.units.find((u) => u.id === 'enemy')?.damage).toBe(3);
  s = step(s, { type: 'choose-mode', playerId: 'b', mode: 'accept' });
  const enemy = s.units.find((u) => u.id === 'enemy');
  expect(enemy).toMatchObject({ zoneId: 'base-b', ready: false, damage: 0 });
  expect(enemy?.buffed).toBeUndefined();
  expect(s.cards.find((c) => c.id === 'boss')?.ready).toBe(false);
  expect(s.resources.b?.power.orange ?? 0).toBe(0);
});

it('The Boss : refusé, l’unité meurt et la légende reste Ready', () => {
  const s = step(scenario(1), {
    type: 'choose-mode',
    playerId: 'b',
    mode: 'skip',
  });
  expect(s.units.some((u) => u.id === 'enemy')).toBe(false);
  expect(s.cards.find((c) => c.id === 'boss')?.ready).toBe(true);
  expect(s.pendingModeChoice ?? null).toBeNull();
});

it('The Boss : sans Power pour payer, l’unité meurt', () => {
  expect(scenario(0).units.some((u) => u.id === 'enemy')).toBe(false);
});

it('The Boss : quand son propriétaire conquiert, la légende se redresse', () => {
  const s = queueConquestLegends(
    {
      ...scenario(1),
      cards: scenario(1).cards,
    },
    [{ type: 'battlefield-conquered', playerId: 'b', battlefieldId: 'f' }],
  ).state;
  expect(s.stack?.entries.at(-1)).toMatchObject({
    kind: 'play-effect',
    effect: { type: 'ready-card', cardId: 'boss' },
  });
  const resolved = drain(s);
  expect(resolved.cards.find((c) => c.id === 'boss')?.ready).toBe(true);
});

it('The Boss : en combat, les morts sont suspendues pour demander, puis le combat reprend', () => {
  const s0 = spellScenario(hextechRay);
  s0.legendDefinitions = [theBoss];
  s0.zones.push({ id: 'legend-b', kind: 'legend', ownerId: 'b' });
  s0.cards.push({
    id: 'boss',
    definitionId: theBoss.id,
    ownerId: 'b',
    zoneId: 'legend-b',
    ready: true,
  });
  s0.units[0] = { ...s0.units[0]!, zoneId: 'g', might: 5 };
  s0.units[1] = { ...s0.units[1]!, might: 2, buffed: true };
  s0.resources.b = { energy: 0, power: { orange: 1 } };
  s0.showdown = {
    kind: 'combat',
    battlefieldId: 'g',
    initiatorId: 'a',
    defenderId: 'b',
    participants: ['a', 'b'],
    priorityPlayerId: 'a',
    consecutivePasses: 0,
    stage: 'damage',
    assignments: {},
  };
  let s = step(s0, {
    type: 'assign-damage',
    playerId: 'a',
    allocations: [{ targetId: 'enemy', amount: 3 }],
  });
  s = step(s, {
    type: 'assign-damage',
    playerId: 'b',
    allocations: [{ targetId: 'ally', amount: 3 }],
  });
  expect(s.pendingModeChoice?.bossSave).toMatchObject({
    unitId: 'enemy',
    combat: true,
  });
  expect(s.units.find((u) => u.id === 'enemy')?.zoneId).toBe('g');
  s = step(s, { type: 'choose-mode', playerId: 'b', mode: 'accept' });
  expect(s.units.find((u) => u.id === 'enemy')).toMatchObject({
    zoneId: 'base-b',
    ready: false,
  });
  expect(s.cards.find((c) => c.id === 'boss')?.ready).toBe(false);
});
