import type { PrintedMetadata } from './printed-metadata.js';
/** Rune imprimée : couleur de Power ; le moteur gère Tap, Channel et recyclage. */
export interface RuneDefinition extends PrintedMetadata {
  readonly id: string;
  readonly name: string;
  readonly type: 'rune';
  readonly color: 'rouge' | 'vert' | 'bleu' | 'orange' | 'violet' | 'jaune';
  readonly text: string;
  readonly imageUrl: string;
}
/** Définition + ID déterministe fourni par l'appelant -> carte de configuration.
 * Ne choisit ni zone ni propriétaire ; refuse un identifiant vide. */
export function createRuneCard(definition: RuneDefinition, id: string) {
  if (!id.trim()) throw new RangeError('Identifiant de rune vide.');
  return { id, definitionId: definition.id, color: definition.color };
}
