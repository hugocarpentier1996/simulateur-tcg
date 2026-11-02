import { expect, it } from 'vitest';
import { settleControl } from './effects/control.js';
import { spellScenario } from './origins-test-fixtures.js';
import { hextechRay } from '../../game-data/src/index.js';

function emptied() {
  const s = spellScenario(hextechRay);
  s.units = s.units.filter((u) => u.id !== 'ally');
  return s;
}

it('Contrôle : en état ouvert, un champ sans carte visible de son contrôleur devient neutre', () => {
  expect(settleControl(emptied()).battlefields[0]?.controllerId).toBeNull();
});

it('Contrôle : rien n’est perdu tant que la pile n’est pas vide (Deathknell qui réinvoque)', () => {
  const s = emptied();
  s.stack = {
    entries: [],
    initiatorId: 'a',
    priorityPlayerId: 'a',
    consecutivePasses: 0,
  };
  s.stack.entries.push({
    kind: 'play-effect',
    sourceId: 'x',
    ownerId: 'a',
    effect: { type: 'draw', count: 1 },
  });
  expect(settleControl(s).battlefields[0]?.controllerId).toBe('a');
});

it('Contrôle : le champ d’un showdown en cours attend la fin du showdown', () => {
  const s = emptied();
  s.showdown = {
    kind: 'open',
    battlefieldId: 'f',
    initiatorId: 'b',
    participants: ['a', 'b'],
    priorityPlayerId: 'a',
    consecutivePasses: 0,
  };
  expect(settleControl(s).battlefields[0]?.controllerId).toBe('a');
});

it('Contrôle : une carte cachée n’est pas visible, un gear l’est', () => {
  const s = emptied();
  s.cards.push({
    id: 'hid',
    definitionId: 'x',
    ownerId: 'a',
    zoneId: 'f',
    facedown: { fresh: false },
  });
  expect(settleControl(s).battlefields[0]?.controllerId).toBeNull();
  s.gears = [
    { id: 'g1', definitionId: 'x', ownerId: 'a', zoneId: 'f', ready: true },
  ];
  expect(settleControl(s).battlefields[0]?.controllerId).toBe('a');
});
