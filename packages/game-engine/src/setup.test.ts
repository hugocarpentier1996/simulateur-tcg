import { describe, expect, it } from 'vitest';
import {
  act,
  createGame,
  recordOpeningRoll,
  type GameState,
  type ActionResult,
} from './index.js';
import { withDrawSupplies } from './test-fixtures.js';
import { startTurn } from './turn/progression.js';
import {
  trifarianWarCamp,
  voidGate,
  fortifiedPosition,
  startippedPeak,
} from '../../game-data/src/index.js';
import { darkChild } from '../../game-data/src/index.js';

it('conserve le catalogue des légendes et pose leur instance Ready hors des unités', () => {
  const input = config();
  for (const player of input.players) {
    player.legend.definitionId = darkChild.id;
    player.legend.colors = [...darkChild.colors];
    for (const rune of player.runes) rune.color = 'rouge';
  }
  const state = accepted(
    createGame({ ...input, legendDefinitions: [darkChild] }),
  );
  expect(state.legendDefinitions).toEqual([darkChild]);
  expect(
    state.cards.filter((c) => c.definitionId === darkChild.id),
  ).toHaveLength(2);
  expect(
    state.cards
      .filter((c) => c.definitionId === darkChild.id)
      .every((c) => c.ready === true),
  ).toBe(true);
  expect(state.units).toEqual([]);
});

function config() {
  return {
    randomState: 123,
    players: ['a', 'b'].map((id) => ({
      id,
      deck: Array.from({ length: 39 }, (_, i) => ({
        id: `${id}-card-${i}`,
        definitionId: 'fixture',
      })),
      runes: Array.from({ length: 12 }, (_, i) => ({
        id: `${id}-rune-${i}`,
        definitionId: 'rune',
        color: i % 2 ? 'rouge' : 'bleu',
      })),
      battlefields: Array.from({ length: 3 }, (_, i) => ({
        id: `${id}-bf-${i}`,
        definitionId: `field-${i}`,
      })),
      legend: {
        id: `${id}-legend`,
        definitionId: 'legend',
        colors: ['rouge', 'bleu'],
      },
      champion: { id: `${id}-champion`, definitionId: 'champion' },
    })),
  };
}
function accepted(result: ActionResult): GameState {
  if (!result.ok) throw new Error(result.reason);
  return result.state;
}
function opening(): GameState {
  let state = accepted(createGame(config()));
  state = accepted(recordOpeningRoll(state, { a: 20, b: 1 }));
  return accepted(
    act(state, {
      type: 'choose-first-player',
      playerId: 'a',
      firstPlayerId: 'b',
    }),
  );
}
function cardsIn(state: GameState, playerId: string, kind: string) {
  const zone = state.zones.find(
    (z) => z.ownerId === playerId && z.kind === kind,
  )!;
  return state.cards.filter((c) => c.zoneId === zone.id).map((c) => c.id);
}

describe('préparation de partie', () => {
  it('vérifie 39 cartes, 12 runes, 3 champs et uniquement les couleurs autorisées', () => {
    const deck = config();
    deck.players[0]!.deck.pop();
    expect(createGame(deck).ok).toBe(false);
    const runes = config();
    runes.players[0]!.runes.pop();
    expect(createGame(runes).ok).toBe(false);
    const fields = config();
    fields.players[0]!.battlefields.pop();
    expect(createGame(fields).ok).toBe(false);
    for (const color of ['vert', 'inconnue']) {
      const input = config();
      input.players[0]!.runes[0]!.color = color;
      expect(createGame(input).ok).toBe(false);
    }
    const legend = config();
    legend.players[0]!.legend.colors = ['rouge', 'bleu', 'vert'];
    expect(createGame(legend).ok).toBe(false);
  });
  it('sélectionne un champ dans chaque réserve en BO1 avec un hasard rejouable', () => {
    const input = config();
    const result = createGame(input);
    const state = accepted(result);
    expect(createGame(input)).toEqual(result);
    expect(state.battlefields).toHaveLength(2);
    for (const player of input.players)
      expect(
        state.battlefields.filter((f) =>
          player.battlefields.some((b) => b.id === f.zoneId),
        ),
      ).toHaveLength(1);
    expect(state.randomState).not.toBe(input.randomState);
  });
  it('attend les deux choix de BF avant les dés en BO3 manche 1', () => {
    let state = accepted(
      createGame({ ...config(), match: { format: 'bo3', gameNumber: 1 } }),
    );
    expect(recordOpeningRoll(state, { a: 20, b: 1 }).ok).toBe(false);
    expect(
      act(state, {
        type: 'choose-battlefield',
        playerId: 'a',
        battlefieldId: 'b-bf-0',
      }).ok,
    ).toBe(false);
    state = accepted(
      act(state, {
        type: 'choose-battlefield',
        playerId: 'a',
        battlefieldId: 'a-bf-2',
      }),
    );
    expect(
      act(state, {
        type: 'choose-battlefield',
        playerId: 'a',
        battlefieldId: 'a-bf-1',
      }).ok,
    ).toBe(false);
    expect(recordOpeningRoll(state, { a: 20, b: 1 }).ok).toBe(false);
    state = accepted(
      act(state, {
        type: 'choose-battlefield',
        playerId: 'b',
        battlefieldId: 'b-bf-0',
      }),
    );
    expect(state.battlefields.map((f) => f.zoneId)).toEqual([
      'a-bf-2',
      'b-bf-0',
    ]);
    expect(state.setup).toEqual({ stage: 'roll' });
  });
  it.each([2, 3] as const)(
    'donne le choix du départ au perdant précédent en manche %i sans dés',
    (gameNumber) => {
      let state = accepted(
        createGame({
          ...config(),
          match: { format: 'bo3', gameNumber, previousLoserId: 'b' },
        }),
      );
      for (const playerId of ['b', 'a'])
        state = accepted(
          act(state, {
            type: 'choose-battlefield',
            playerId,
            battlefieldId: `${playerId}-bf-1`,
          }),
        );
      expect(state.setup).toEqual({ stage: 'choose-first', chooserId: 'b' });
      expect(recordOpeningRoll(state, { a: 20, b: 1 }).ok).toBe(false);
      state = accepted(
        act(state, {
          type: 'choose-first-player',
          playerId: 'b',
          firstPlayerId: 'a',
        }),
      );
      expect(state.activePlayerId).toBe('a');
      expect(state.initialChannelBonusPlayerId).toBe('b');
      expect(
        createGame({
          ...config(),
          match: { format: 'bo3', gameNumber, previousLoserId: 'absent' },
        }).ok,
      ).toBe(false);
    },
  );
  it('place légendes/champions hors du deck et attend les dés sans autoriser le jeu', () => {
    const input = config();
    const before = structuredClone(input);
    const state = accepted(createGame(input));
    expect(state.phase).toBe('setup');
    expect(state.setup).toEqual({ stage: 'roll' });
    for (const player of ['a', 'b']) {
      expect(cardsIn(state, player, 'legend')).toEqual([`${player}-legend`]);
      expect(cardsIn(state, player, 'champion')).toEqual([
        `${player}-champion`,
      ]);
      expect(cardsIn(state, player, 'deck')).toHaveLength(39);
    }
    expect(act(state, { type: 'end-turn', playerId: 'a' })).toEqual({
      ok: false,
      reason: 'SETUP_IN_PROGRESS',
    });
    expect(input).toEqual(before);
  });
  it('relance en cas d’égalité, puis réserve le choix du premier joueur au gagnant', () => {
    const initial = accepted(createGame(config()));
    const tie = recordOpeningRoll(initial, { a: 12, b: 12 });
    let state = accepted(tie);
    expect(state.setup?.stage).toBe('roll');
    expect(recordOpeningRoll(state, { a: 0, b: 21 }).ok).toBe(false);
    expect(recordOpeningRoll(state, { a: 1.5, b: 4 }).ok).toBe(false);
    expect(recordOpeningRoll(state, { a: 2 }).ok).toBe(false);
    state = accepted(recordOpeningRoll(state, { a: 4, b: 18 }));
    expect(state.setup).toEqual({ stage: 'choose-first', chooserId: 'b' });
    expect(recordOpeningRoll(state, { a: 20, b: 1 }).ok).toBe(false);
    expect(
      act(state, {
        type: 'choose-first-player',
        playerId: 'a',
        firstPlayerId: 'a',
      }).ok,
    ).toBe(false);
    expect(
      act(state, {
        type: 'choose-first-player',
        playerId: 'b',
        firstPlayerId: 'absent',
      }).ok,
    ).toBe(false);
    state = accepted(
      act(state, {
        type: 'choose-first-player',
        playerId: 'b',
        firstPlayerId: 'a',
      }),
    );
    expect(state.activePlayerId).toBe('a');
    expect(state.initialChannelBonusPlayerId).toBe('b');
    expect(cardsIn(state, 'a', 'hand')).toHaveLength(4);
    expect(cardsIn(state, 'b', 'hand')).toHaveLength(4);
  });
  it('recycle sous le deck, remplace le même nombre et attend les deux décisions', () => {
    const input = opening();
    const before = structuredClone(input);
    let state = accepted(
      act(input, {
        type: 'mulligan',
        playerId: 'a',
        cardIds: ['a-card-1', 'a-card-3'],
      }),
    );
    expect(cardsIn(state, 'a', 'hand')).toEqual([
      'a-card-0',
      'a-card-2',
      'a-card-4',
      'a-card-5',
    ]);
    expect(cardsIn(state, 'a', 'deck')).toEqual([
      ...Array.from({ length: 33 }, (_, i) => `a-card-${i + 6}`),
      'a-card-1',
      'a-card-3',
    ]);
    expect(state.phase).toBe('setup');
    expect(cardsIn(state, 'b', 'runes')).toHaveLength(0);
    expect(
      act(state, { type: 'mulligan', playerId: 'a', cardIds: [] }).ok,
    ).toBe(false);
    state = accepted(
      act(state, { type: 'mulligan', playerId: 'b', cardIds: [] }),
    );
    expect(state.setup).toBeNull();
    expect(state.phase).toBe('main');
    expect(state.activePlayerId).toBe('b');
    expect(cardsIn(state, 'b', 'hand')).toHaveLength(5);
    expect(cardsIn(state, 'a', 'hand')).toHaveLength(4);
    expect(cardsIn(state, 'b', 'runes')).toHaveLength(2);
    state = accepted(act(state, { type: 'end-turn', playerId: 'b' }));
    expect(cardsIn(state, 'a', 'hand')).toHaveLength(5);
    expect(cardsIn(state, 'a', 'runes')).toHaveLength(3);
    expect(input).toEqual(before);
  });
  it('autorise une seule carte et refuse plus de deux, doublons, cartes adverses ou hors main', () => {
    const state = opening();
    const before = structuredClone(state);
    for (const cardIds of [
      ['a-card-0', 'a-card-1', 'a-card-2'],
      ['a-card-0', 'a-card-0'],
      ['b-card-0'],
      ['a-card-9'],
      ['a-legend'],
    ]) {
      expect(act(state, { type: 'mulligan', playerId: 'a', cardIds }).ok).toBe(
        false,
      );
    }
    const next = accepted(
      act(state, { type: 'mulligan', playerId: 'a', cardIds: ['a-card-0'] }),
    );
    expect(cardsIn(next, 'a', 'hand')).toEqual([
      'a-card-1',
      'a-card-2',
      'a-card-3',
      'a-card-4',
    ]);
    expect(state).toEqual(before);
  });
  it('refuse les configurations incohérentes avant de commencer', () => {
    const shortDeck = config();
    shortDeck.players[0]!.deck = [];
    expect(createGame(shortDeck).ok).toBe(false);
    const duplicate = config();
    duplicate.players[1]!.legend.id = 'a-card-0';
    expect(createGame(duplicate).ok).toBe(false);
    const duplicatePlayer = config();
    duplicatePlayer.players[1]!.id = 'a';
    expect(createGame(duplicatePlayer).ok).toBe(false);
    const solo = config();
    solo.players.pop();
    expect(createGame(solo).ok).toBe(false);
  });
});

function turnScenario(): GameState {
  return withDrawSupplies({
    activePlayerId: 'a',
    phase: 'main',
    players: [
      { id: 'a', score: 0 },
      { id: 'b', score: 0 },
    ],
    initialChannelBonusPlayerId: 'b',
    zones: ['a', 'b'].flatMap((ownerId) => [
      { id: `pile-${ownerId}`, ownerId, kind: 'rune-pile' as const },
      { id: `runes-${ownerId}`, ownerId, kind: 'runes' as const },
    ]),
    cards: ['a', 'b'].flatMap((ownerId) =>
      Array.from({ length: 8 }, (_, i) => ({
        id: `r-${ownerId}-${i}`,
        definitionId: 'rune',
        ownerId,
        zoneId: `pile-${ownerId}`,
        ready: false,
      })),
    ),
    units: [],
    resources: {},
    battlefields: [],
    scoredBattlefields: {},
    showdown: null,
  });
}

describe('bonus de Channel initial', () => {
  it('démarre le premier tour sans fin de tour fictive : deux runes et une cinquième carte', () => {
    const input = turnScenario();
    input.cards.push(
      ...Array.from({ length: 4 }, (_, i) => ({
        id: `opening-${i}`,
        definitionId: 'fixture',
        ownerId: 'a',
        zoneId: 'hand-a',
      })),
    );
    const before = structuredClone(input);
    const result = startTurn(input);
    expect(result.state.phase).toBe('main');
    expect(result.state.activePlayerId).toBe('a');
    expect(
      result.state.cards.filter((c) => c.zoneId === 'hand-a'),
    ).toHaveLength(5);
    expect(
      result.state.cards.filter((c) => c.zoneId === 'runes-a'),
    ).toHaveLength(2);
    expect(result.state.initialChannelBonusPlayerId).toBe('b');
    expect(
      result.events
        .filter((e) => e.type === 'phase-started')
        .map((e) => e.phase),
    ).toEqual(['awaken', 'beginning', 'channel', 'draw', 'main']);
    expect(result.events.some((e) => e.type === 'turn-ended')).toBe(false);
    expect(input).toEqual(before);
  });
  it('accorde trois runes au premier tour du second joueur, puis deux à chacun', () => {
    let state = turnScenario();
    const before = structuredClone(state);
    for (const [playerId, expectedA, expectedB] of [
      ['a', 0, 3],
      ['b', 2, 3],
      ['a', 2, 5],
    ] as const) {
      const result = act(state, { type: 'end-turn', playerId });
      if (!result.ok) throw new Error(result.reason);
      state = result.state;
      expect(state.cards.filter((c) => c.zoneId === 'runes-a')).toHaveLength(
        expectedA,
      );
      expect(state.cards.filter((c) => c.zoneId === 'runes-b')).toHaveLength(
        expectedB,
      );
      expect(
        state.cards
          .filter((c) => c.zoneId.startsWith('runes-'))
          .every((c) => c.ready),
      ).toBe(true);
    }
    expect(turnScenario()).toEqual(before);
  });
  it('consomme le bonus initial même si la pile ne contient pas trois runes', () => {
    const input = turnScenario();
    input.cards = input.cards.filter(
      (c) => c.ownerId !== 'b' || !c.id.startsWith('r-b-') || c.id === 'r-b-0',
    );
    const result = act(input, { type: 'end-turn', playerId: 'a' });
    if (!result.ok) throw new Error(result.reason);
    expect(
      result.state.cards.filter((c) => c.zoneId === 'runes-b'),
    ).toHaveLength(1);
    expect(result.state.initialChannelBonusPlayerId).toBeNull();
  });
});

it.each(['bo1', 'bo3'] as const)(
  'les champs Origins sélectionnés en %s gardent leurs définitions et effets',
  (format) => {
    const input = config();
    const catalogue = [
      trifarianWarCamp,
      voidGate,
      fortifiedPosition,
      startippedPeak,
    ];
    input.players.forEach((p, i) =>
      p.battlefields.forEach(
        (b, j) => (b.definitionId = catalogue[(j + i) % catalogue.length]!.id),
      ),
    );
    const request = {
      ...input,
      battlefieldDefinitions: catalogue,
      match:
        format === 'bo1'
          ? ({ format } as const)
          : ({ format, gameNumber: 1 } as const),
    };
    let s = accepted(createGame(request));
    expect(createGame(request)).toEqual(createGame(request));
    expect(s.battlefieldDefinitions).toEqual(catalogue);
    if (format === 'bo3') {
      expect(s.battlefields).toEqual([]);
      for (const p of input.players)
        s = accepted(
          act(s, {
            type: 'choose-battlefield',
            playerId: p.id,
            battlefieldId: p.battlefields[2]!.id,
          }),
        );
      expect(s.battlefields.map((f) => f.definitionId)).toEqual(
        input.players.map((p) => p.battlefields[2]!.definitionId),
      );
    } else {
      expect(s.battlefields).toHaveLength(2);
      input.players.forEach((p, i) =>
        expect(
          p.battlefields.some(
            (b) =>
              b.id === s.battlefields[i]!.zoneId &&
              b.definitionId === s.battlefields[i]!.definitionId,
          ),
        ).toBe(true),
      );
    }
    expect(
      s.battlefields.every((f) =>
        catalogue.some((d) => d.id === f.definitionId),
      ),
    ).toBe(true);
  },
);
