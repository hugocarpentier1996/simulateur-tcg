import { expect, it } from 'vitest';
import {
  incinerate,
  highlander,
  deathTestUnits,
  testSpells,
  garenOrder,
  masterYiCalm,
  defineSpell,
} from '../../game-data/src/index.js';
import { act, type GameAction, type GameState } from './index.js';
import { withDrawSupplies } from './test-fixtures.js';

function fixture(): GameState {
  return withDrawSupplies({
    activePlayerId: 'a',
    phase: 'main',
    players: [
      { id: 'a', score: 0 },
      { id: 'b', score: 0 },
    ],
    zones: [
      { id: 'field', kind: 'battlefield' },
      ...['a', 'b'].flatMap((ownerId) =>
        (['base', 'graveyard', 'runes', 'rune-pile'] as const).map((kind) => ({
          id: `${kind}-${ownerId}`,
          kind,
          ownerId,
        })),
      ),
    ],
    spellDefinitions: [incinerate, highlander, ...testSpells],
    unitDefinitions: [...deathTestUnits, garenOrder, masterYiCalm],
    cards: [
      ...['a', 'b'].flatMap((ownerId) =>
        [incinerate, highlander, ...testSpells].map((d) => ({
          id: `${ownerId}-${d.id}`,
          definitionId: d.id,
          ownerId,
          zoneId: `hand-${ownerId}`,
        })),
      ),
    ],
    units: [
      {
        id: 'ua',
        definitionId: 'fixture',
        ownerId: 'a',
        zoneId: 'field',
        might: 3,
        damage: 0,
        ready: true,
      },
      {
        id: 'ub',
        definitionId: 'fixture',
        ownerId: 'b',
        zoneId: 'field',
        might: 4,
        damage: 0,
        ready: true,
      },
    ],
    resources: Object.fromEntries(
      ['a', 'b'].map((id) => [
        id,
        {
          energy: 20,
          power: { 'color-1': 3, 'color-2': 3, jaune: 2, vert: 2 },
        },
      ]),
    ),
    battlefields: [{ zoneId: 'field', controllerId: 'b' }],
    scoredBattlefields: {},
    showdown: null,
  });
}
function step(s: GameState, a: GameAction) {
  const r = act(s, a);
  if (!r.ok) throw new Error(r.reason);
  return r;
}
function cast(
  playerId = 'a',
  targetId = 'ub',
  definitionId = incinerate.id,
): GameAction {
  return {
    type: 'cast-spell',
    playerId,
    targetId,
    cardId: `${playerId}-${definitionId}`,
    payment: { energyRunes: [], powerRunes: [] },
  };
}
function resolve(s: GameState) {
  s = step(s, { type: 'pass', playerId: s.stack!.priorityPlayerId }).state;
  return step(s, { type: 'pass', playerId: s.stack!.priorityPlayerId });
}
function combat(s: GameState): GameState {
  return {
    ...s,
    showdown: {
      kind: 'combat',
      battlefieldId: 'field',
      initiatorId: 'a',
      defenderId: 'b',
      participants: ['a', 'b'],
      priorityPlayerId: 'a',
      consecutivePasses: 0,
      stage: 'priority',
      assignments: {},
    },
  };
}

it('paie 2 énergie sans Power ; dégâts seulement après les réactions, conservés après le sort', () => {
  const s = fixture();
  const paid = step(s, cast()).state;
  expect(paid.resources.a?.energy).toBe(18);
  expect(paid.resources.a?.power).toEqual(s.resources.a?.power);
  expect(paid.units[1]?.damage).toBe(0);
  const resolved = resolve(paid);
  expect(resolved.state.units[1]?.damage).toBe(2);
  expect(
    resolved.state.cards.find((c) => c.id === `a-${incinerate.id}`)?.zoneId,
  ).toBe('graveyard-a');
});

it('refuse la base et les réactions ; revérifie la zone après une réponse', () => {
  const s = fixture();
  s.units[1]!.zoneId = 'base-b';
  expect(act(s, cast())).toEqual({ ok: false, reason: 'INVALID_TARGET' });
  s.units[1]!.zoneId = 'field';
  const paid = step(s, cast()).state;
  expect(act(paid, cast('a', 'ua'))).toEqual({
    ok: false,
    reason: 'CARD_NOT_IN_HAND',
  });
  paid.cards.push({
    id: `a-${incinerate.id}`,
    definitionId: incinerate.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  expect(act(paid, cast('a', 'ua'))).toEqual({
    ok: false,
    reason: 'SPELL_WINDOW_CLOSED',
  });
  paid.units[1]!.zoneId = 'base-b';
  expect(resolve(paid).state.units[1]?.damage).toBe(0);
});

it('cumule les dégâts et tue au seuil ; zéro Might sans dégâts reste vivant', () => {
  let s = resolve(step(fixture(), cast()).state).state;
  s.units.push({
    id: 'zero',
    definitionId: 'fixture',
    ownerId: 'a',
    zoneId: 'base-a',
    might: 0,
    damage: 0,
    ready: false,
  });
  s.priorityPlayerId = 'a';
  s.cards.push({
    id: `a-${incinerate.id}`,
    definitionId: incinerate.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.cards = s.cards.filter((c) => c.zoneId !== 'graveyard-a');
  s = resolve(step(s, cast()).state).state;
  expect(s.units.map((u) => u.id)).toEqual(['ua', 'zero']);
  expect(s.cards.find((c) => c.id === 'ub')?.zoneId).toBe('graveyard-b');
  expect(s.battlefields[0]?.controllerId).toBeNull();
});

it('permet Highlander en réponse et rappelle au lieu de mourir', () => {
  let s = fixture();
  s.units[1]!.might = 2;
  s = step(s, cast()).state;
  s = step(s, { type: 'pass', playerId: 'a' }).state;
  s = step(s, cast('b', 'ub', highlander.id)).state;
  s = resolve(s).state;
  s = resolve(s).state;
  expect(s.units[1]).toMatchObject({
    id: 'ub',
    zoneId: 'base-b',
    ready: false,
    damage: 0,
  });
});

it('la mort du défenseur ouvre ses choix avant tout score et conserve le contrôle pour son jeton', () => {
  let s = combat(fixture());
  s.units[1]!.definitionId = 'reborn';
  s.units[1]!.might = 1;
  s.units[0]!.damage = 1;
  s = resolve(step(s, cast()).state).state;
  expect(s.cards.find((c) => c.id === 'ub')?.zoneId).toBe('graveyard-b');
  expect(s.units[0]?.damage).toBe(1);
  expect(s.pendingDeaths?.playerOrder).toEqual(['b']);
  expect(s.battlefields[0]?.controllerId).toBe('b');
  expect(s.players[0]?.score).toBe(0);
  s = step(s, {
    type: 'queue-death-effects',
    playerId: 'b',
    effects: [{ sourceId: 'ub', destinationId: 'field' }],
  }).state;
  expect(s.stack?.entries).toHaveLength(1);
  s = resolve(s).state;
  expect(s.units.find((u) => u.token)).toMatchObject({
    ownerId: 'b',
    zoneId: 'field',
    might: 3,
    ready: false,
  });
  expect(s.showdown).toMatchObject({ kind: 'combat', stage: 'priority' });
  expect(s.players[0]?.score).toBe(0);
});

it('une baisse de Might tue une unité déjà blessée sans soigner les autres', () => {
  const s = fixture();
  s.units[1]!.might = 3;
  s.units[1]!.damage = 2;
  s.units[0]!.damage = 1;
  const r = resolve(step(s, cast('a', 'ub', 'test-weaken-draw')).state);
  expect(r.state.units.map((u) => u.id)).toEqual(['ua']);
  expect(r.state.units[0]?.damage).toBe(1);
});

it('soigne globalement à la fin du tour avant expiration des bonus', () => {
  let s = fixture();
  s.units[0]!.damage = 2;
  s.units[0]!.might = 1;
  s.units[0]!.temporaryEffects = [{ type: 'modify-might', amount: 2 }];
  s.units[1]!.damage = 1;
  s = step(s, { type: 'end-turn', playerId: 'a' }).state;
  expect(s.units.map((u) => u.damage)).toEqual([0, 0]);
  expect(s.units[0]?.temporaryEffects).toEqual([]);
});

it('valide la quantité de dégâts imprimée', () => {
  for (const amount of [-1, Infinity, NaN])
    expect(() =>
      defineSpell({ ...incinerate, effects: [{ type: 'damage', amount }] }),
    ).toThrow(RangeError);
});

it('perdre la huitième rune en payant tue Master Yi déjà blessé', () => {
  const s = fixture();
  s.units[0] = {
    ...s.units[0]!,
    definitionId: masterYiCalm.id,
    might: 4,
    damage: 5,
  };
  s.cards.push(
    ...Array.from({ length: 8 }, (_, i) => ({
      id: `rune-${i}`,
      definitionId: 'rune',
      ownerId: 'a',
      zoneId: 'runes-a',
      color: 'vert',
      ready: true,
    })),
  );
  s.cards.push({
    id: 'yi-card',
    definitionId: masterYiCalm.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a!.power.vert = 0;
  const r = step(s, {
    type: 'play-unit',
    playerId: 'a',
    cardId: 'yi-card',
    payment: { energyRunes: [], powerRunes: ['rune-0'] },
  });
  expect(r.state.units.some((u) => u.id === 'ua')).toBe(false);
  expect(r.state.cards.find((c) => c.id === 'ua')?.zoneId).toBe('graveyard-a');
});

it('la disparition de Garen tue aussi un allié blessé qui perd son aura, sans soigner', () => {
  const s = fixture();
  s.units[1]!.definitionId = garenOrder.id;
  s.units[1]!.might = 5;
  s.units[1]!.damage = 3;
  s.units.push({
    id: 'fragile',
    definitionId: 'fixture',
    ownerId: 'b',
    zoneId: 'field',
    might: 1,
    damage: 1,
    ready: false,
  });
  const r = resolve(step(s, cast()).state);
  expect(r.state.units.map((u) => u.id)).toEqual(['ua']);
  expect(
    r.events.filter((e) => e.type === 'unit-died').map((e) => e.unitId),
  ).toEqual(['ub', 'fragile']);
});

it('un nouvel effet de mort rejoint le sommet de la pile restante, avec une fenêtre de réaction', () => {
  let s = fixture();
  const reaction = defineSpell({
    ...incinerate,
    id: 'fixture-reaction',
    timing: 'reaction',
  });
  s.spellDefinitions = [...s.spellDefinitions!, reaction];
  s.cards.push({
    id: `a-${reaction.id}`,
    definitionId: reaction.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.units[1]!.definitionId = 'reborn';
  s.units[1]!.might = 2;
  s = step(s, cast('a', 'ua')).state;
  s = step(s, cast('a', 'ub', reaction.id)).state;
  s = resolve(s).state;
  expect(s.pendingDeaths?.playerOrder).toEqual(['b']);
  s = step(s, {
    type: 'queue-death-effects',
    playerId: 'b',
    effects: [{ sourceId: 'ub', destinationId: 'base-b' }],
  }).state;
  expect(s.stack?.entries).toHaveLength(2);
  expect(s.stack?.entries.at(-1)).toMatchObject({
    kind: 'death',
    sourceId: 'ub',
  });
  expect(s.stack?.priorityPlayerId).toBe('a');
  s = resolve(s).state;
  expect(s.stack?.entries).toHaveLength(1);
  expect(s.units[0]?.damage).toBe(0);
  s = resolve(s).state;
  expect(s.units[0]?.damage).toBe(2);
});

it('une mort en réaction pendant les effets de fin de combat empêche un score prématuré et permet la relance', () => {
  let s = combat(fixture());
  if (s.showdown?.kind !== 'combat') throw new Error('Fixture');
  s.showdown.stage = 'effects';
  s.combatAftermath = { defenderEliminated: false };
  s.units[1]!.definitionId = 'reborn';
  s.units[1]!.might = 2;
  const reaction = defineSpell({
    ...incinerate,
    id: 'fixture-reaction',
    timing: 'reaction',
  });
  s.spellDefinitions = [...s.spellDefinitions!, reaction];
  s.cards.push({
    id: `a-${reaction.id}`,
    definitionId: reaction.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.stack = {
    entries: [
      {
        kind: 'death',
        sourceId: 'previous',
        ownerId: 'a',
        effect: { type: 'summon-token', definitionId: 'spirit' },
        destinationId: 'base-a',
      },
    ],
    initiatorId: 'a',
    priorityPlayerId: 'a',
    consecutivePasses: 0,
  };
  s = resolve(step(s, cast('a', 'ub', reaction.id)).state).state;
  expect(s.players[0]?.score).toBe(0);
  expect(s.battlefields[0]?.controllerId).toBe('b');
  s = step(s, {
    type: 'queue-death-effects',
    playerId: 'b',
    effects: [{ sourceId: 'ub', destinationId: 'field' }],
  }).state;
  s = resolve(s).state;
  const r = resolve(s);
  expect(r.state.showdown).toMatchObject({ kind: 'combat', stage: 'priority' });
  expect(r.events.some((e) => e.type === 'combat-restarted')).toBe(true);
  expect(r.state.players[0]?.score).toBe(0);
});
