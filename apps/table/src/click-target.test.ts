import { expect, it } from 'vitest';
import { spellScenario } from '../../../packages/game-engine/src/origins-test-fixtures.js';
import {
  incinerate,
  gentlemensDuel,
} from '../../../packages/game-data/src/index.js';
import { pickTarget, targetOptions, type Session } from './session.js';
import { renderTable } from './view.js';

const session = (state: Session['state']): Session => ({
  state,
  history: [],
  log: [],
  error: null,
});

it('surligne les unités ciblables et lance le sort au clic sur une cible unique', () => {
  const s = session(spellScenario(incinerate));
  expect(targetOptions(s, 'spell', []).next).toEqual(['ally', 'enemy']);
  expect(renderTable(s, { cardId: 'spell' })).toContain(
    'unit-card ready targetable',
  );
  const picked = pickTarget(s, { cardId: 'spell' }, 'enemy');
  expect(picked.selection).toBeNull();
  expect(picked.session.error).toBeNull();
  expect(picked.session.state.stack?.entries).toHaveLength(1);
  expect(picked.session.history).toHaveLength(1);
});

it('demande deux clics pour le Duel : unité alliée puis unité ennemie', () => {
  const s = session(spellScenario(gentlemensDuel));
  const first = pickTarget(s, { cardId: 'spell' }, 'ally');
  expect(first.session).toBe(s);
  expect(first.selection).toEqual({ cardId: 'spell', picks: ['ally'] });
  expect(targetOptions(s, 'spell', ['ally']).next).toEqual(['enemy']);
  expect(renderTable(s, first.selection)).toContain('contre');
  const second = pickTarget(s, first.selection!, 'enemy');
  expect(second.selection).toBeNull();
  expect(second.session.state.stack?.entries).toHaveLength(1);
});

it('refuse un clic sur une unité qui n’est pas une cible légale sans rien modifier', () => {
  const s = session(spellScenario(gentlemensDuel));
  const wrong = pickTarget(s, { cardId: 'spell' }, 'enemy');
  expect(wrong.selection).toEqual({ cardId: 'spell' });
  expect(wrong.session.state).toBe(s.state);
  expect(wrong.session.error).toMatch(/cible/);
});
