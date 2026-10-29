import { expect, it } from 'vitest';
import { spellScenario, step, noRunes } from './origins-test-fixtures.js';
import { stupefy, singularity, firstMate } from '../../game-data/src/index.js';
import { act } from './act.js';
import { getLegalActions } from './legal/actions.js';
import { poutyPoro } from '../../game-data/src/index.js';
const cast = {
  type: 'cast-spell' as const,
  playerId: 'a',
  cardId: 'spell',
  targetId: 'enemy',
  payment: noRunes,
};
it('une mise en jeu reste possible si aucune cible de capacité ne peut être payée', () => {
  const s = spellScenario(stupefy);
  s.unitDefinitions = [poutyPoro, firstMate];
  s.units = s.units.filter((u) => u.id === 'enemy');
  s.units[0]!.definitionId = poutyPoro.id;
  s.resources.a!.power = {};
  s.cards[0]!.definitionId = firstMate.id;
  expect(
    act(s, {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'spell',
      payment: noRunes,
    }).ok,
  ).toBe(true);
});
it('Deflect demande un Power quelconque, même depuis une rune Tap ; le ciblage allié ne paie pas', () => {
  let s = spellScenario(stupefy);
  s.unitDefinitions = [poutyPoro];
  s.units[1]!.definitionId = poutyPoro.id;
  s.resources.a!.power = {};
  expect(act(s, cast).ok).toBe(false);
  s.cards.push({
    id: 'r',
    definitionId: 'rune',
    ownerId: 'a',
    zoneId: 'runes-a',
    ready: false,
    color: 'jaune',
  });
  const paid = { ...cast, payment: { energyRunes: [], powerRunes: ['r'] } };
  expect(getLegalActions(s, 'a')).toContainEqual(paid);
  s = step(s, paid);
  expect(s.cards.find((c) => c.id === 'r')?.zoneId).toBe('rune-pile-a');
  const friendly = spellScenario(stupefy);
  friendly.unitDefinitions = [poutyPoro];
  friendly.units[0]!.definitionId = poutyPoro.id;
  friendly.resources.a!.power = {};
  expect(act(friendly, { ...cast, targetId: 'ally' }).ok).toBe(true);
});
it('deux Pouty choisis par Singularity coûtent deux Power de plus, sans remplacer le coût bleu', () => {
  let s = spellScenario(singularity);
  s.unitDefinitions = [poutyPoro];
  s.units = s.units.map((u) => ({
    ...u,
    ownerId: 'b',
    definitionId: poutyPoro.id,
  }));
  s.resources.a!.power = { bleu: 2, jaune: 1 };
  const action = { ...cast, targetId: 'a', selectedUnitIds: ['ally', 'enemy'] };
  expect(act(s, action).ok).toBe(false);
  s.resources.a!.power.jaune = 2;
  s = step(s, action);
  expect(s.resources.a!.power).toMatchObject({ bleu: 0, jaune: 0 });
});
it('Deflect taxe aussi First Mate, mais jamais un effet de zone sans choix individuel', () => {
  const area = {
    ...stupefy,
    target: { kind: 'battlefield' as const },
    effects: [{ type: 'damage-enemies-at-battlefield' as const, amount: 1 }],
  };
  const s = spellScenario(area);
  s.unitDefinitions = [poutyPoro, firstMate];
  s.units[1]!.definitionId = poutyPoro.id;
  s.resources.a!.power = {};
  expect(act(s, { ...cast, targetId: 'g' }).ok).toBe(true);
  s.cards[0]!.definitionId = firstMate.id;
  const play = {
    type: 'play-unit' as const,
    playerId: 'a',
    cardId: 'spell',
    onPlayTargetId: 'enemy',
    payment: noRunes,
  };
  expect(act(s, play).ok).toBe(false);
  s.resources.a!.power.vert = 1;
  expect(act(s, play).ok).toBe(true);
});
