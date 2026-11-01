import { expect, it } from 'vitest';
import { spellScenario } from '../../../packages/game-engine/src/origins-test-fixtures.js';
import {
  incinerate,
  ironBallista,
  blindMonk,
  handOfNoxus,
  salvage,
  sealOfRage,
} from '../../../packages/game-data/src/index.js';
import {
  cardActions,
  submitCardAction,
  targetOptions,
  useGear,
  gearHasResource,
  type Session,
} from './session.js';
import { renderTable } from './view.js';

function session(): Session {
  const state = spellScenario(incinerate);
  state.gearDefinitions = [sealOfRage];
  state.cards.push({
    id: 'seal',
    definitionId: sealOfRage.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  state.resources.a = { energy: 0, power: { rouge: 1 } };
  return { state, history: [], log: [], error: null };
}

it('propose de poser un gear depuis la main, puis l’affiche en base', () => {
  const s = session();
  const [pose] = cardActions(s, 'seal');
  expect(pose).toMatchObject({ type: 'play-gear', cardId: 'seal' });
  expect(renderTable(s, { cardId: 'seal' })).toContain('Poser en base');
  const next = submitCardAction(s, 'seal', pose!);
  expect(next.error).toBeNull();
  expect(next.log.join('\n')).toMatch(/Joueur 1 pose Seal of Rage/);
  const html = renderTable(next, null);
  expect(html).toContain('data-gear="seal"');
  expect(html).toContain('gear-card ready');
});

it('active un gear de ressource au clic, qui se couche', () => {
  const s = session();
  const placed = submitCardAction(s, 'seal', cardActions(s, 'seal')[0]!);
  const used = useGear(placed, 'seal');
  expect(used.error).toBeNull();
  expect(used.state.resources.a!.power.rouge).toBe(1);
  expect(used.log.at(-1)).toMatch(/Seal of Rage.*\+1 Power Fury/);
  expect(renderTable(used, null)).toContain('gear-card tapped');
  expect(useGear(used, 'seal').error).toBeTruthy();
});

it('Salvage : un gear en jeu est une cible cliquable du ciblage', () => {
  const state = spellScenario(salvage);
  state.gearDefinitions = [sealOfRage];
  state.gears = [
    {
      id: 'seal',
      definitionId: sealOfRage.id,
      ownerId: 'b',
      zoneId: 'base-b',
      ready: true,
    },
  ];
  state.resources.a = { energy: 2, power: { jaune: 1 } };
  const s: Session = { state, history: [], log: [], error: null };
  expect(targetOptions(s, 'spell', []).next).toContain('seal');
  const html = renderTable(s, { cardId: 'spell', targeting: true, picks: [] });
  expect(html).toMatch(/data-gear="seal" class="gear-card ready targetable"/);
});

it('Iron Ballista : sélectionner le gear propose sa capacité Tap sur chaque cible', () => {
  const state = spellScenario(incinerate);
  state.gearDefinitions = [ironBallista];
  state.gears = [
    {
      id: 'ballista',
      definitionId: ironBallista.id,
      ownerId: 'a',
      zoneId: 'base-a',
      ready: true,
    },
  ];
  const s: Session = { state, history: [], log: [], error: null };
  const actions = cardActions(s, 'ballista');
  expect(
    actions.map((a) => (a.type === 'activate-gear' ? a.targetId : null)),
  ).toEqual(expect.arrayContaining(['enemy', 'ally']));
  expect(renderTable(s, { cardId: 'ballista' })).toContain('Iron Ballista → ');
  const used = submitCardAction(
    s,
    'ballista',
    actions.find((a) => a.type === 'activate-gear' && a.targetId === 'enemy')!,
  );
  expect(used.error).toBeNull();
  expect(used.state.stack?.entries).toHaveLength(1);
});

it('Blind Monk : la légende est cliquable et propose sa capacité Tap', () => {
  const state = spellScenario(incinerate);
  state.legendDefinitions = [blindMonk];
  state.zones.push({ id: 'legend-a', kind: 'legend', ownerId: 'a' });
  state.cards.push({
    id: 'monk',
    definitionId: blindMonk.id,
    ownerId: 'a',
    zoneId: 'legend-a',
    ready: true,
  });
  state.resources.a = { energy: 1, power: {} };
  const s: Session = { state, history: [], log: [], error: null };
  expect(renderTable(s, null)).toContain('data-card="monk"');
  const actions = cardActions(s, 'monk');
  expect(actions).toContainEqual(
    expect.objectContaining({
      type: 'activate-gear',
      gearId: 'monk',
      targetId: 'ally',
    }),
  );
});

it('Hand of Noxus : la légende de ressource se couche au clic (Legion remplie)', () => {
  const state = spellScenario(incinerate);
  state.legendDefinitions = [handOfNoxus];
  state.zones.push({ id: 'legend-a', kind: 'legend', ownerId: 'a' });
  state.cards.push({
    id: 'noxus',
    definitionId: handOfNoxus.id,
    ownerId: 'a',
    zoneId: 'legend-a',
    ready: true,
  });
  state.cardsPlayedThisTurn = { a: 1 };
  const s: Session = { state, history: [], log: [], error: null };
  expect(renderTable(s, null)).toContain('data-gear="noxus"');
  expect(gearHasResource(s.state, 'noxus')).toBe(true);
  const used = useGear(s, 'noxus');
  expect(used.error).toBeNull();
  expect(used.state.cards.find((c) => c.id === 'noxus')?.ready).toBe(false);
});
