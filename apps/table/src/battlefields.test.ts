import { expect, it } from 'vitest';
import { createDemo, tableActions, dispatch, boardOptions } from './session.js';
import { renderTable } from './view.js';
import {
  fortifiedPosition,
  startippedPeak,
} from '../../../packages/game-data/src/index.js';
it('démo illustrée : noms, images locales et catalogue des quatre champs', () => {
  const s = createDemo(true);
  expect(s.state.battlefieldDefinitions).toHaveLength(4);
  const html = renderTable(s, null);
  expect(html).toContain('/cards/');
  expect(html).toContain('Daring Poro');
  expect(html).not.toContain('src="https:');
  for (const b of s.state.battlefields)
    expect(html).toContain(b.definitionId! + '.png');
});
it('BO3 propose trois choix par joueur et prépare le tour après les deux choix', () => {
  let s = createDemo(true, 'bo3');
  expect(
    tableActions(s).filter((a) => a.type === 'choose-battlefield'),
  ).toHaveLength(6);
  for (const playerId of ['a', 'b']) {
    const a = tableActions(s).find(
      (a) => a.type === 'choose-battlefield' && a.playerId === playerId,
    )!;
    s = dispatch(s, a);
  }
  expect(s.state.phase).toBe('main');
  expect(s.state.battlefields).toHaveLength(2);
});
it('Peak offre accepter/refuser et la pile se passe depuis le panneau', () => {
  let s = createDemo(true);
  s.state.battlefields[0]!.definitionId = startippedPeak.id;
  s.state.battlefields[0]!.controllerId = 'b';
  s.state.units.push({
    id: 'holder',
    definitionId: 'ogn-210-298',
    ownerId: 'b',
    zoneId: s.state.battlefields[0]!.zoneId,
    ready: false,
    might: 2,
    damage: 0,
  });
  s = dispatch(s, { type: 'end-turn', playerId: 'a' });
  expect(renderTable(s, null)).toContain('Réactions');
  s = dispatch(
    s,
    tableActions(s).find((a) => a.type === 'pass')!,
  );
  s = dispatch(
    s,
    tableActions(s).find((a) => a.type === 'pass')!,
  );
  expect(renderTable(s, null)).toContain('Ne pas ajouter');
  const yes = tableActions(s).find(
    (a) => a.type === 'choose-hold-channel' && a.accept,
  )!;
  s = dispatch(s, yes);
  expect(s.state.phase).toBe('main');
});
it('attaque, choix Shield et répartition de combat sont accessibles sans règle UI dupliquée', () => {
  let s = createDemo(true);
  const f = s.state.battlefields[0]!;
  f.definitionId = fortifiedPosition.id;
  f.controllerId = 'b';
  s.state.units = [
    {
      id: 'attacker',
      definitionId: 'ogn-210-298',
      ownerId: 'a',
      zoneId: 'zone:a:base',
      ready: true,
      might: 2,
      damage: 0,
    },
    {
      id: 'defender',
      definitionId: 'ogn-210-298',
      ownerId: 'b',
      zoneId: f.zoneId,
      ready: false,
      might: 2,
      damage: 0,
    },
  ];
  const move = boardOptions(s.state, 'attacker').find(
    (a) => a.destinationId === f.zoneId,
  )!;
  expect(move).toBeDefined();
  s = dispatch(s, move);
  expect(renderTable(s, null)).toContain('Shield');
  s = dispatch(
    s,
    tableActions(s).find(
      (a) => a.type === 'choose-defense-shield' && a.targetId === 'defender',
    )!,
  );
  for (let i = 0; i < 4; i++)
    s = dispatch(
      s,
      tableActions(s).find((a) => a.type === 'pass')!,
    );
  expect(tableActions(s).some((a) => a.type === 'assign-damage')).toBe(true);
  expect(renderTable(s, null)).toContain('Répartir');
  for (let i = 0; i < 2; i++)
    s = dispatch(
      s,
      tableActions(s).find((a) => a.type === 'assign-damage')!,
    );
  expect(s.state.showdown).toBeNull();
});
