import type { GameConfig } from './create-game.js';

const colors = new Set(['rouge', 'vert', 'bleu', 'orange', 'violet', 'jaune']);

/** Configuration typée -> composition et références cohérentes. La légalité des effets/tags
 * et les restrictions de copies ne sont pas encore couvertes par les catalogues. */
export function validGameConfig(config: GameConfig): boolean {
  const ids = config.players.map((p) => p.id);
  if (ids.some((id) => !id) || new Set(ids).size !== ids.length) return false;
  const cards = config.players.flatMap((p) => [
    ...p.deck,
    ...p.runes,
    p.legend,
    p.champion,
    ...p.battlefields,
  ]);
  if (
    cards.some((c) => !c.id || !c.definitionId) ||
    new Set(cards.map((c) => c.id)).size !== cards.length
  )
    return false;
  if (
    config.randomState !== undefined &&
    (!Number.isInteger(config.randomState) ||
      config.randomState < 0 ||
      config.randomState > 0xffffffff)
  )
    return false;
  if (
    config.battlefieldSelection === 'provided' &&
    config.match?.format === 'bo3'
  )
    return false;
  const match = config.match;
  if (
    match?.format === 'bo3' &&
    match.gameNumber !== 1 &&
    !ids.includes(match.previousLoserId)
  )
    return false;
  return config.players.every(
    (p) =>
      p.deck.length === 39 &&
      p.runes.length === 12 &&
      p.battlefields.length ===
        (config.battlefieldSelection === 'provided' ? 1 : 3) &&
      p.legend.colors.length >= 1 &&
      p.legend.colors.length <= 2 &&
      new Set(p.legend.colors).size === p.legend.colors.length &&
      p.legend.colors.every((color) => colors.has(color)) &&
      p.runes.every(
        (r) => r.color !== undefined && p.legend.colors.includes(r.color),
      ),
  );
}
