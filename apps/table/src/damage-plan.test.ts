import { expect, it } from 'vitest';
import { spellScenario } from '../../../packages/game-engine/src/origins-test-fixtures.js';
import { act } from '../../../packages/game-engine/src/index.js';
import { hextechRay } from '../../../packages/game-data/src/index.js';
import { damageAssigner, damagePlan, toggleDamagePick } from './damage-plan.js';
import { renderTable } from './view.js';

function combat(tank = false) {
  const s = spellScenario(hextechRay);
  s.units = [
    { ...s.units[0]!, id: 'att', zoneId: 'g', might: 5 },
    { ...s.units[1]!, id: 'd1', might: 2 },
    { ...s.units[1]!, id: 'd2', might: 4, ...(tank ? { tank: true } : {}) },
  ];
  s.showdown = {
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
  return s;
}

it('Dégâts au clic : chaque clic donne de quoi tuer, ou le reste ; validation quand tout est réparti', () => {
  const s = combat();
  expect(damageAssigner(s)).toBe('a');
  const empty = damagePlan(s, 'a', [])!;
  expect(empty).toMatchObject({ power: 5, remaining: 5, valid: false });
  expect(empty.next.sort()).toEqual(['d1', 'd2']);
  const one = damagePlan(s, 'a', ['d1'])!;
  expect(one.allocations).toEqual([{ targetId: 'd1', amount: 2 }]);
  expect(one).toMatchObject({ remaining: 3, next: ['d2'], valid: false });
  const both = damagePlan(s, 'a', ['d1', 'd2'])!;
  expect(both.allocations).toEqual([
    { targetId: 'd1', amount: 2 },
    { targetId: 'd2', amount: 3 },
  ]);
  expect(both).toMatchObject({ remaining: 0, next: [], valid: true });
  const r = act(s, {
    type: 'assign-damage',
    playerId: 'a',
    allocations: both.allocations,
  });
  expect(r.ok).toBe(true);
  if (r.ok) expect(damageAssigner(r.state)).toBe('b');
});

it('Dégâts au clic : Tank d’abord ; un nouveau clic retire la cible et les suivantes', () => {
  const s = combat(true);
  expect(damagePlan(s, 'a', [])!.next).toEqual(['d2']);
  expect(damagePlan(s, 'a', ['d1'])!.allocations).toEqual([]);
  expect(toggleDamagePick(['d2', 'd1'], 'd2')).toEqual([]);
  expect(toggleDamagePick(['d2'], 'd1')).toEqual(['d2', 'd1']);
});

it('Dégâts au clic : encadré sur le côté du champ avec le total et le bouton Valider', () => {
  const s = combat();
  const html = renderTable(
    { state: s, log: [], error: null, history: [] },
    null,
    [],
    null,
    {
      damagePicks: ['d1'],
    },
  );
  expect(html).toContain('damage-box');
  expect(html).toContain('data-action="damage-confirm" disabled');
  expect(html).not.toContain('data-choice="0">Joueur 1 · Répartir');
});
