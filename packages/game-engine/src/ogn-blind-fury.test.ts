import { expect, it } from 'vitest';
import { killGears } from './effects/kill-gear.js';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import {
  blindFury,
  kinkouMonk,
  hextechRay,
  fallingStar,
  sealOfRage,
} from '../../game-data/src/index.js';

it('Blind Fury : révèle le dessus du deck adverse ; une unité est jouée gratuitement sous son contrôle', () => {
  const s0 = spellScenario(blindFury);
  s0.unitDefinitions = [kinkouMonk];
  s0.zones.push({ id: 'banished-b', kind: 'banished', ownerId: 'b' });
  s0.cards = s0.cards.filter((c) => c.zoneId !== 'deck-b');
  s0.cards.push({
    id: 'monk',
    definitionId: kinkouMonk.id,
    ownerId: 'b',
    zoneId: 'deck-b',
  });
  s0.resources.a = { energy: 4, power: { rouge: 2 } };
  const s = resolveTop(
    step(s0, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'a',
      payment: noRunes,
    }),
  );
  expect(s.units.find((u) => u.id === 'monk')).toMatchObject({
    ownerId: 'a',
    cardOwnerId: 'b',
    zoneId: 'base-a',
  });
});

it('Blind Fury : une carte non jouable reste bannie', () => {
  const s0 = spellScenario(blindFury);
  s0.zones.push({ id: 'banished-b', kind: 'banished', ownerId: 'b' });
  s0.cards = s0.cards.filter((c) => c.zoneId !== 'deck-b');
  s0.cards.push({
    id: 'odd',
    definitionId: 'filler',
    ownerId: 'b',
    zoneId: 'deck-b',
  });
  s0.resources.a = { energy: 4, power: { rouge: 2 } };
  const s = resolveTop(
    step(s0, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'a',
      payment: noRunes,
    }),
  );
  expect(s.cards.find((c) => c.id === 'odd')?.zoneId).toBe('banished-b');
});

function reveal(
  definitionId: string,
  extra: (s: ReturnType<typeof spellScenario>) => void,
) {
  const s0 = spellScenario(blindFury);
  extra(s0);
  s0.zones.push({ id: 'banished-b', kind: 'banished', ownerId: 'b' });
  s0.cards = s0.cards.filter((c) => c.zoneId !== 'deck-b');
  s0.cards.push({ id: 'top', definitionId, ownerId: 'b', zoneId: 'deck-b' });
  s0.resources.a = { energy: 4, power: { rouge: 2 } };
  return resolveTop(
    step(s0, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'a',
      payment: noRunes,
    }),
  );
}

it('Blind Fury : un sort à cible révélé est lancé, sa cible choisie à sa mise sur la pile', () => {
  let s = reveal(hextechRay.id, (s0) => {
    s0.spellDefinitions = [blindFury, hextechRay];
  });
  s = resolveTop(s);
  expect(s.pendingModeChoice?.castOptions?.map((o) => o.targetId)).toEqual([
    'ally',
    'enemy',
  ]);
  s = step(s, { type: 'choose-mode', playerId: 'a', mode: 'cast-option:1' });
  s = resolveTop(s);
  expect(s.units.some((u) => u.id === 'enemy')).toBe(false);
  expect(s.cards.find((c) => c.id === 'top')?.zoneId).toBe('graveyard-b');
});

it('Blind Fury : un gear révélé est joué dans la base du lanceur', () => {
  const s = reveal(sealOfRage.id, (s0) => {
    s0.gearDefinitions = [sealOfRage];
  });
  expect(s.gears?.find((g) => g.id === 'top')).toMatchObject({
    ownerId: 'a',
    cardOwnerId: 'b',
    zoneId: 'base-a',
  });
  const killed = killGears(s, ['top']).state;
  expect(killed.cards.find((c) => c.id === 'top')).toMatchObject({
    ownerId: 'b',
    zoneId: 'graveyard-b',
  });
});

it('Blind Fury : un sort à choix multiples révélé (Falling Star) propose toutes ses répartitions', () => {
  let s = reveal(fallingStar.id, (s0) => {
    s0.spellDefinitions = [blindFury, fallingStar];
    s0.units = s0.units.map((u) => ({ ...u, might: 9 }));
  });
  s = resolveTop(s);
  const options = s.pendingModeChoice?.castOptions ?? [];
  const index = options.findIndex(
    (o) => o.selectedUnitIds?.join() === 'enemy,enemy',
  );
  expect(index).toBeGreaterThanOrEqual(0);
  s = step(s, {
    type: 'choose-mode',
    playerId: 'a',
    mode: `cast-option:${index}`,
  });
  s = resolveTop(s);
  expect(s.units.find((u) => u.id === 'enemy')?.damage).toBe(6);
});
