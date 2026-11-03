import { expect, it } from 'vitest';
import { spellScenario } from '../../../packages/game-engine/src/origins-test-fixtures.js';
import { act } from '../../../packages/game-engine/src/index.js';
import {
  fortifiedPosition,
  hextechRay,
} from '../../../packages/game-data/src/index.js';
import { clickChoices, type Session } from './session.js';
import { cursorHint, renderTable } from './view.js';

function defending(): Session {
  const s = spellScenario(hextechRay);
  s.battlefieldDefinitions = [fortifiedPosition];
  s.battlefields[1]!.definitionId = fortifiedPosition.id;
  s.units[0] = { ...s.units[0]!, zoneId: 'base-a' };
  const r = act(s, {
    type: 'move',
    playerId: 'a',
    unitId: 'ally',
    destinationId: 'g',
  });
  if (!r.ok) throw new Error(r.reason);
  return { state: r.state, log: [], error: null, history: [] };
}

it('Fortified Position : la cible du Shield se choisit en cliquant l’unité', () => {
  const session = defending();
  const choices = clickChoices(session);
  expect(choices.get('enemy')).toMatchObject({
    type: 'choose-defense-shield',
    targetId: 'enemy',
  });
  expect(renderTable(session, null)).toMatch(
    /data-card="enemy" class="unit-card [^"]*targetable/,
  );
  expect(cursorHint(session, null, {}, 'enemy')).toContain('Shield 2');
});

it('Indication au curseur : rien sur un élément sans effet', () => {
  const s = spellScenario(hextechRay);
  const session: Session = { state: s, log: [], error: null, history: [] };
  expect(clickChoices(session).size).toBe(0);
  expect(cursorHint(session, null, {}, 'ally')).toBeNull();
});

it('Indication au curseur : en ciblage, le sort et ce qui est demandé', () => {
  const s = spellScenario(hextechRay);
  s.resources.a = { energy: 1, power: { rouge: 1 } };
  const session: Session = { state: s, log: [], error: null, history: [] };
  const hint = cursorHint(
    session,
    { cardId: 'spell', targeting: true, picks: [] },
    {},
    'enemy',
  );
  expect(hint).toMatch(/cible 1/);
});

it('Plusieurs cibles (Divine Judgment) : les clics composent le choix « garder 2 »', async () => {
  const { divineJudgment } =
    await import('../../../packages/game-data/src/index.js');
  const { multiPickOptions } = await import('./session.js');
  const s0 = spellScenario(divineJudgment);
  s0.units.push({ ...s0.units[0]!, id: 'a2' }, { ...s0.units[0]!, id: 'a3' });
  s0.resources.a = { energy: 7, power: { jaune: 2 } };
  let r = act(s0, {
    type: 'cast-spell',
    playerId: 'a',
    cardId: 'spell',
    targetId: 'a',
    payment: { energyRunes: [], powerRunes: [] },
  });
  if (!r.ok) throw new Error(r.reason);
  for (const p of ['a', 'b']) {
    r = act(r.state, { type: 'pass', playerId: p });
    if (!r.ok) throw new Error(r.reason);
  }
  const session: Session = {
    state: r.state,
    log: [],
    error: null,
    history: [],
  };
  const start = multiPickOptions(session, []);
  expect(start.active).toBe(true);
  expect(start.next.sort()).toEqual(['a2', 'a3', 'ally']);
  const one = multiPickOptions(session, ['a3']);
  expect(one.complete).toEqual([]);
  const two = multiPickOptions(session, ['a3', 'ally']);
  expect(two.complete).toEqual([
    { type: 'choose-mode', playerId: 'a', mode: 'keep:ally+a3' },
  ]);
  expect(two.next).toEqual([]);
});

it('Cartes de défausse désignées par un choix : affichées et cliquables dans le panneau', async () => {
  const { drMundo, mobilize } =
    await import('../../../packages/game-data/src/index.js');
  const s = spellScenario(mobilize);
  s.unitDefinitions = [drMundo];
  s.units[0] = { ...s.units[0]!, definitionId: drMundo.id, zoneId: 'base-a' };
  s.cards.push({
    id: 't0',
    definitionId: hextechRay.id,
    ownerId: 'a',
    zoneId: 'graveyard-a',
  });
  s.pendingModeChoice = {
    kind: 'mode-choice',
    sourceId: 'ally',
    ownerId: 'a',
    modes: ['recycle-any:t0'],
    recycleLeft: 1,
    recycleOwn: true,
    recycleMandatory: true,
  };
  s.stack = {
    entries: [],
    initiatorId: 'a',
    priorityPlayerId: 'a',
    consecutivePasses: 0,
  };
  const session: Session = { state: s, log: [], error: null, history: [] };
  expect(clickChoices(session).get('t0')).toMatchObject({
    mode: 'recycle-any:t0',
  });
  expect(renderTable(session, null)).toMatch(
    /pick-list"><li data-card="t0" class="targetable"/,
  );
});
