import { expect, it } from 'vitest';
import { decisiveStrike, flash, luxMind } from '../../game-data/src/index.js';
import {
  act,
  effectiveMight,
  type GameState,
  type GameAction,
} from './index.js';
import { withDrawSupplies } from './test-fixtures.js';

const payment = { energyRunes: [], powerRunes: [] };
const cast: GameAction = {
  type: 'cast-spell',
  playerId: 'a',
  cardId: 'strike',
  targetId: 'a',
  payment,
};
function fixture(): GameState {
  return withDrawSupplies({
    players: [
      { id: 'a', score: 0 },
      { id: 'b', score: 0 },
    ],
    activePlayerId: 'a',
    phase: 'main',
    showdown: null,
    zones: ['a', 'b'].flatMap((ownerId) =>
      (['base', 'graveyard'] as const).map((kind) => ({
        id: `${kind}-${ownerId}`,
        kind,
        ownerId,
      })),
    ),
    cards: [
      {
        id: 'strike',
        definitionId: decisiveStrike.id,
        ownerId: 'a',
        zoneId: 'hand-a',
      },
      { id: 'flash', definitionId: flash.id, ownerId: 'a', zoneId: 'hand-a' },
    ],
    unitDefinitions: [luxMind],
    spellDefinitions: [decisiveStrike, flash],
    units: [
      {
        id: 'lux',
        definitionId: luxMind.id,
        ownerId: 'a',
        zoneId: 'base-a',
        ready: false,
        might: 5,
        damage: 0,
      },
    ],
    resources: {
      a: { energy: 20, power: { jaune: 3 } },
      b: { energy: 20, power: { jaune: 3 } },
    },
    battlefields: [],
    scoredBattlefields: {},
  });
}
function step(s: GameState, a: GameAction): GameState {
  const result = act(s, a);
  if (!result.ok) throw new Error(result.reason);
  return result.state;
}
function resolve(s: GameState) {
  s = step(s, { type: 'pass', playerId: s.stack!.priorityPlayerId });
  return step(s, { type: 'pass', playerId: s.stack!.priorityPlayerId });
}
it('empile le bonus au-dessus du sort, sans modifier la Might avant résolution', () => {
  const s = fixture();
  const next = step(s, cast);
  expect(next.stack!.entries).toHaveLength(2);
  expect(effectiveMight(next.units[0]!)).toBe(5);
  const boosted = resolve(next);
  expect(effectiveMight(boosted.units[0]!)).toBe(8);
  expect(boosted.stack!.entries).toHaveLength(1);
  expect(effectiveMight(resolve(boosted).units[0]!)).toBe(10);
  expect(s.units[0]!.temporaryEffects).toBeUndefined();
});
it('permet une réaction au bonus puis une nouvelle fenêtre avant le sort', () => {
  let s = step(fixture(), cast);
  s = step(s, {
    type: 'cast-spell',
    playerId: 'a',
    cardId: 'flash',
    targetId: 'a',
    selectedUnitIds: [],
    payment,
  });
  expect(s.stack!.entries).toHaveLength(3);
  s = resolve(s);
  expect(effectiveMight(s.units[0]!)).toBe(5);
  s = resolve(s);
  expect(effectiveMight(s.units[0]!)).toBe(8);
  expect(s.stack!.priorityPlayerId).toBe('a');
});
it('déclenche chaque Lux alliée, jamais la Lux adverse', () => {
  const s = fixture();
  s.units.push(
    { ...s.units[0]!, id: 'second' },
    { ...s.units[0]!, id: 'enemy', ownerId: 'b', zoneId: 'base-b' },
  );
  let next = step(s, cast);
  expect(next.stack!.entries).toHaveLength(3);
  next = resolve(resolve(next));
  expect(next.units.map((u) => effectiveMight(u))).toEqual([8, 8, 5]);
});
it('ne déclenche ni pour un sort moins cher ni pour un lancement refusé', () => {
  const s = fixture();
  expect(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'flash',
      targetId: 'a',
      selectedUnitIds: [],
      payment,
    }).stack!.entries,
  ).toHaveLength(1);
  s.resources.a!.energy = 4;
  expect(act(s, cast)).toEqual({ ok: false, reason: 'INSUFFICIENT_RESOURCES' });
  expect(s.stack).toBeUndefined();
});
it('utilise le coût imprimé même si une réserve réservée paie tout le sort', () => {
  const s = fixture();
  s.resources.a = { energy: 0, spellEnergy: 5, power: { jaune: 1 } };
  expect(step(s, cast).stack!.entries).toHaveLength(2);
});
it('ignore la source disparue avant résolution du bonus', () => {
  const s = step(fixture(), cast);
  s.units = [];
  const next = resolve(s);
  expect(next.units).toEqual([]);
  expect(next.stack!.entries).toHaveLength(1);
});
it('le bonus expire à la fin du tour', () => {
  let s = resolve(resolve(step(fixture(), cast)));
  s = step(s, { type: 'pass', playerId: 'b' });
  s = step(s, { type: 'end-turn', playerId: 'a' });
  expect(effectiveMight(s.units[0]!)).toBe(5);
});

it('cumule deux déclenchements même quand Lux est Tap et Stun', () => {
  const s = fixture();
  s.units[0]!.stunned = true;
  s.cards.push({
    id: 'second-strike',
    definitionId: decisiveStrike.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  let next = resolve(resolve(step(s, cast)));
  next = step(next, { type: 'pass', playerId: 'b' });
  next = resolve(resolve(step(next, { ...cast, cardId: 'second-strike' })));
  expect(effectiveMight(next.units[0]!)).toBe(15);
});

it.each([4, 5, 6])(
  'déclenche à partir du seuil imprimé : %s énergie',
  (energy) => {
    const s = fixture();
    s.spellDefinitions = [{ ...decisiveStrike, cost: { energy, power: {} } }];
    expect(step(s, cast).stack!.entries).toHaveLength(energy >= 5 ? 2 : 1);
  },
);

it('ne déclenche pas pour un sort joué par l’adversaire', () => {
  const s = fixture();
  s.activePlayerId = 'b';
  s.cards = s.cards.map((c) =>
    c.id === 'strike' ? { ...c, ownerId: 'b', zoneId: 'hand-b' } : c,
  );
  const next = step(s, { ...cast, playerId: 'b', targetId: 'b' });
  expect(next.stack!.entries).toHaveLength(1);
});

it('joue Lux depuis la main pour 6 énergie et 1 bleu, Tap avec 5 Might', () => {
  const s = fixture();
  s.cards.push({
    id: 'new-lux',
    definitionId: luxMind.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  const play: GameAction = {
    type: 'play-unit',
    playerId: 'a',
    cardId: 'new-lux',
    destinationId: 'base-a',
    payment,
  };
  expect(act(s, play)).toEqual({ ok: false, reason: 'INSUFFICIENT_RESOURCES' });
  s.resources.a = { energy: 6, power: { bleu: 1 } };
  const next = step(s, play);
  expect(next.units.find((u) => u.id === 'new-lux')).toMatchObject({
    ready: false,
    might: 5,
  });
  expect(next.resources.a).toEqual({ energy: 0, power: { bleu: 0 } });
});
