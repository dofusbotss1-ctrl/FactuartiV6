// filepath: src/utils/text.ts
/**
 * Normalise un nom d'entreprise pour comparaisons insensibles à la casse/accents/espaces.
 * WHY: garantit l'unicité logique ("ACME  corp", "acmé corp", etc.).
 */
export function normalizeCompanyName(input: string): string {
  return input
    .trim()
    .normalize('NFD')
    // @ts-expect-error: \p{Diacritic} nécessite le flag 'u'
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ');
}