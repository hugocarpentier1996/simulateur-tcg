import { expect, it } from 'vitest';
import { spellScenario } from '../../../packages/game-engine/src/origins-test-fixtures.js';
import {
  incinerate,
  flash,
  gentlemensDuel,
  recruitTheVanguard,
  recruitToken,
  windWall,
  hextechRay,
} from '../../../packages/game-data/src/index.js';
import {
  cardActions,
  submitCardAction,
  handPlayer,
  tableActions,
  dispatch,
  startTargeting,
  type Session,
} from './session.js';
import { renderTable } from './view.js';
const session = (state: Session['state']): Session => ({
  state,
  history: [],
  log: [],
  error: null,
});
it('sélectionne une cible légale, paie et empile sans résoudre immédiatement', () => {
  const s = session(spellScenario(incinerate));
  const actions = cardActions(s, 'spell');
  expect(actions).toHaveLength(2);
  const selected = actions.find(
    (a) => a.type === 'cast-spell' && a.targetId === 'enemy',
  )!;
  expect(renderTable(s, { cardId: 'spell' })).toContain('data-card-action');
  const next = submitCardAction(s, 'spell', selected);
  expect(next.error).toBeNull();
  expect(next.state.resources.a!.energy).toBe(8);
  expect(next.state.stack?.entries).toHaveLength(1);
  expect(next.state.units[1]!.damage).toBe(0);
  expect(next.history).toHaveLength(1);
  const stale = {
    ...s,
    state: {
      ...s.state,
      resources: { ...s.state.resources, a: { energy: 0, power: {} } },
    },
  };
  expect(submitCardAction(stale, 'spell', selected).state).toBe(stale.state);
});
it('montre la main du joueur prioritaire et autorise une réaction à la réaction', () => {
  const state = spellScenario(flash);
  state.cards[0]!.ownerId = 'b';
  state.cards[0]!.zoneId = 'hand-b';
  state.resources.b = { energy: 10, power: {} };
  state.showdown = {
    kind: 'open',
    battlefieldId: 'g',
    initiatorId: 'a',
    participants: ['a', 'b'],
    priorityPlayerId: 'b',
    consecutivePasses: 1,
  };
  const s = session(state);
  expect(handPlayer(state)).toBe('b');
  expect(renderTable(s, null)).toContain('Main de Joueur 2');
  const a = cardActions(s, 'spell')[0]!;
  expect(a).toBeTruthy();
  const next = submitCardAction(s, 'spell', a);
  expect(next.state.stack).toBeTruthy();
  next.state.cards.push({
    id: 'reply',
    definitionId: flash.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  expect(cardActions(next, 'reply').length).toBeGreaterThan(0);
  expect(cardActions(next, 'spell')).toHaveLength(0);
});
it('expose les deux cibles du Duel et les destinations des quatre Recrues', () => {
  const duel = session(spellScenario(gentlemensDuel));
  expect(
    cardActions(duel, 'spell').some(
      (a) =>
        a.type === 'cast-spell' &&
        a.targetId === 'ally' &&
        a.secondaryTargetId === 'enemy',
    ),
  ).toBe(true);
  expect(renderTable(duel, { cardId: 'spell' })).toContain('contre');
  const state = spellScenario(recruitTheVanguard);
  state.unitDefinitions = [recruitToken];
  const s = session(state);
  expect(
    cardActions(s, 'spell').some(
      (a) => a.type === 'cast-spell' && a.tokenDestinations?.length === 4,
    ),
  ).toBe(true);
  expect(renderTable(s, { cardId: 'spell' })).toContain('Recrues');
});
it('propose les choix obligatoires de vision et de défausse', () => {
  const s = session(spellScenario(flash));
  s.state.pendingDiscard = { playerId: 'a', sourceId: 'ally' };
  s.state.stack = {
    entries: [],
    initiatorId: 'a',
    priorityPlayerId: 'a',
    consecutivePasses: 0,
  };
  expect(tableActions(s).some((a) => a.type === 'choose-discard')).toBe(true);
  expect(renderTable(s, null)).toContain('Défausser');
});

it('révèle la carte examinée par Vision avant le choix', () => {
  const s = session(spellScenario(flash));
  s.state.cards.find((c) => c.id === 'draw-a-0')!.definitionId = flash.id;
  s.state.pendingVision = {
    playerId: 'a',
    sourceId: 'ally',
    cardId: 'draw-a-0',
  };
  s.state.stack = {
    entries: [],
    initiatorId: 'a',
    priorityPlayerId: 'a',
    consecutivePasses: 0,
  };
  expect(renderTable(s, null)).toContain('Vision : Flash');
  expect(
    tableActions(s).filter((a) => a.type === 'choose-vision'),
  ).toHaveLength(2);
});

it('rend directement la Main au joueur actif après résolution hors Showdown', () => {
  let s = session(spellScenario(incinerate));
  s = submitCardAction(
    s,
    'spell',
    cardActions(s, 'spell').find(
      (a) => a.type === 'cast-spell' && a.targetId === 'enemy',
    )!,
  );
  s = dispatch(s, { type: 'pass', playerId: 'a' });
  s = dispatch(s, { type: 'pass', playerId: 'b' });
  expect(s.state.stack).toBeNull();
  expect(handPlayer(s.state)).toBe('a');
  expect(tableActions(s)).toEqual([]);
  expect(renderTable(s, null)).not.toContain('Rendre la priorité');
});

it('Wind Wall : « Lancer » contre directement l’unique sort de la pile', () => {
  const state = spellScenario(windWall);
  state.resources.a = { energy: 3, power: { vert: 2 } };
  state.activePlayerId = 'b';
  state.spellDefinitions = [windWall, hextechRay];
  state.stack = {
    entries: [
      {
        card: {
          id: 'ray',
          definitionId: hextechRay.id,
          ownerId: 'b',
          zoneId: 'hand-b',
        },
        definition: hextechRay,
        casterId: 'b',
        targetId: 'ally',
      },
    ],
    initiatorId: 'b',
    priorityPlayerId: 'a',
    consecutivePasses: 0,
  };
  const s: Session = { state, history: [], log: [], error: null };
  expect(renderTable(s, { cardId: 'spell' })).toContain('Hextech Ray (ray)');
  const cast = startTargeting(s, { cardId: 'spell' });
  expect(cast.selection).toBeNull();
  expect(cast.session.error).toBeNull();
});
