import { expect, it } from 'vitest';
import { spellScenario } from '../../../packages/game-engine/src/origins-test-fixtures.js';
import { incinerate } from '../../../packages/game-data/src/index.js';
import {
  cardActions,
  submitCardAction,
  dispatch,
  type Session,
} from './session.js';

const session = (state: Session['state']): Session => ({
  state,
  history: [],
  log: [],
  error: null,
});

it('raconte le lancement, la résolution et les dégâts d’un sort ciblé', () => {
  let s = session(spellScenario(incinerate));
  const cast = cardActions(s, 'spell').find(
    (a) => a.type === 'cast-spell' && a.targetId === 'enemy',
  )!;
  s = submitCardAction(s, 'spell', cast);
  expect(s.log.join('\n')).toContain('Joueur 1 lance Incinerate');
  s = dispatch(s, { type: 'pass', playerId: 'a' });
  s = dispatch(s, { type: 'pass', playerId: 'b' });
  const log = s.log.join('\n');
  expect(log).toContain('Incinerate se résout');
  expect(log).toMatch(/Incinerate inflige \d+ dégât\(s\)/);
});

it('signale la mort d’une unité dans le journal', () => {
  const state = spellScenario(incinerate);
  state.units[1] = { ...state.units[1]!, might: 1 };
  let s = session(state);
  s = submitCardAction(
    s,
    'spell',
    cardActions(s, 'spell').find(
      (a) => a.type === 'cast-spell' && a.targetId === 'enemy',
    )!,
  );
  s = dispatch(s, { type: 'pass', playerId: 'a' });
  s = dispatch(s, { type: 'pass', playerId: 'b' });
  expect(s.log.join('\n')).toMatch(/est détruite/);
});
