import { expect, it } from 'vitest';
import { spellScenario } from '../../../packages/game-engine/src/origins-test-fixtures.js';
import { hextechRay, pakaaCub } from '../../../packages/game-data/src/index.js';
import { cardActions, submitCardAction, type Session } from './session.js';
import { renderTable } from './view.js';

it('Hidden : « Cacher sur Champ 1 », puis dos de carte sur le champ', () => {
  const state = spellScenario(hextechRay);
  state.unitDefinitions = [pakaaCub];
  state.cards.push({
    id: 'cub',
    definitionId: pakaaCub.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  state.resources.a = { energy: 0, power: { orange: 1 } };
  const s: Session = { state, history: [], log: [], error: null };
  const hide = cardActions(s, 'cub').find((a) => a.type === 'hide-card');
  expect(hide).toBeDefined();
  expect(renderTable(s, { cardId: 'cub' })).toContain(
    'Cacher sur Champ 1 (1 Power)',
  );
  const next = submitCardAction(s, 'cub', hide!);
  expect(next.error).toBeNull();
  expect(next.log.join('\n')).toMatch(/cache une carte face cachée/);
  expect(renderTable(next, null)).toContain(
    'data-card="cub" class="facedown-card fresh"',
  );
});
