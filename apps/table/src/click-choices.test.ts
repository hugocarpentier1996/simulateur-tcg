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
