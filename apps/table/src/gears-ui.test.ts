import { expect, it } from 'vitest';
import { spellScenario } from '../../../packages/game-engine/src/origins-test-fixtures.js';
import {
  incinerate,
  sealOfRage,
} from '../../../packages/game-data/src/index.js';
import {
  cardActions,
  submitCardAction,
  useGear,
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
