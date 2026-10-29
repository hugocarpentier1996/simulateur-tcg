import * as data from '../../../packages/game-data/src/index.js';
import type { CardCost } from '../../../packages/game-data/src/index.js';
/** Métadonnées de présentation ; les règles restent dans les définitions du moteur. */
export interface DisplayCard {
  id: string;
  name: string;
  type: string;
  displayName?: string;
  tags?: readonly string[];
  imageLocal?: string;
  text?: string;
  might?: number;
  cost?: CardCost;
  entersReady?: boolean;
}
const cards = (Object.values(data) as unknown[]).filter(
  (v): v is DisplayCard =>
    !!v && typeof v === 'object' && 'id' in v && 'name' in v && 'type' in v,
);
export function cardInfo(id: string): DisplayCard | undefined {
  return (
    cards.find((c) => c.id === id) ?? data.testUnits.find((c) => c.id === id)
  );
}
export const illustratedUnits = [
  data.daringPoro,
  data.pettyOfficer,
  data.vanguardAttendant,
  data.garenBody,
];
export const demoBattlefields = [
  data.fortifiedPosition,
  data.startippedPeak,
  data.trifarianWarCamp,
  data.voidGate,
];
