import { expect, it } from 'vitest';
import { spellScenario } from '../../../packages/game-engine/src/origins-test-fixtures.js';
import {
  incinerate,
  gentlemensDuel,
  singularity,
} from '../../../packages/game-data/src/index.js';
import {
  confirmTargets,
  startTargeting,
  targetOptions,
  toggleTarget,
  type Session,
} from './session.js';
import { renderTable } from './view.js';

const session = (state: Session['state']): Session => ({
  state,
  history: [],
  log: [],
  error: null,
});

it('propose « Lancer » sans surligner de cible avant le ciblage', () => {
  const s = session(spellScenario(incinerate));
  const html = renderTable(s, { cardId: 'spell' });
  expect(html).toContain('data-action="start-targeting"');
  expect(html).not.toContain('targetable');
});

it('Lancer, cliquer la cible, puis Valider : le sort est payé et empilé', () => {
  const s = session(spellScenario(incinerate));
  const started = startTargeting(s, { cardId: 'spell' });
  expect(started.selection).toEqual({
    cardId: 'spell',
    targeting: true,
    picks: [],
  });
  expect(renderTable(s, started.selection)).toContain(
    'unit-card ready targetable',
  );
  const picked = toggleTarget(s, started.selection!, 'enemy');
  expect(picked.session.state.stack).toBeFalsy();
  expect(picked.selection!.picks).toEqual(['enemy']);
  expect(renderTable(s, picked.selection)).toContain(
    'data-action="confirm-targets"',
  );
  const cast = confirmTargets(picked.session, picked.selection!);
  expect(cast.selection).toBeNull();
  expect(cast.session.state.stack?.entries).toHaveLength(1);
  expect(cast.session.history).toHaveLength(1);
});

it('Duel : unité alliée puis ennemie, dans cet ordre', () => {
  const s = session(spellScenario(gentlemensDuel));
  const base = { cardId: 'spell', targeting: true, picks: [] };
  expect(toggleTarget(s, base, 'enemy').session.error).toMatch(/cible/);
  const first = toggleTarget(s, base, 'ally');
  expect(targetOptions(s, 'spell', ['ally']).next).toEqual(['enemy']);
  const second = toggleTarget(s, first.selection!, 'enemy');
  expect(second.selection!.picks).toEqual(['ally', 'enemy']);
  expect(
    confirmTargets(s, second.selection!).session.state.stack?.entries,
  ).toHaveLength(1);
});

it('Singularity : jusqu’à deux unités, un second clic retire une cible', () => {
  const s = session(spellScenario(singularity));
  s.state.resources.a = { energy: 10, power: { bleu: 2 } };
  const base = { cardId: 'spell', targeting: true, picks: [] };
  expect(targetOptions(s, 'spell', []).next.sort()).toEqual(['ally', 'enemy']);
  let sel = toggleTarget(s, base, 'enemy').selection!;
  sel = toggleTarget(s, sel, 'ally').selection!;
  expect(sel.picks).toEqual(['enemy', 'ally']);
  sel = toggleTarget(s, sel, 'enemy').selection!;
  expect(sel.picks).toEqual(['ally']);
  const cast = confirmTargets(s, sel);
  expect(cast.session.error).toBeNull();
  expect(cast.session.state.stack?.entries[0]).toMatchObject({
    selectedUnitIds: ['ally'],
  });
});

it('refuse de valider sans cible et garde la partie intacte', () => {
  const s = session(spellScenario(incinerate));
  const refused = confirmTargets(s, {
    cardId: 'spell',
    targeting: true,
    picks: [],
  });
  expect(refused.session.state).toBe(s.state);
  expect(refused.session.error).toMatch(/cible/);
});
