export type SearchableItem = {
  id?: string;
  name?: string;
  locality?: string;
  address?: string;
  category?: string;
  description?: string;
  facilities?: string[];
  [key: string]: unknown;
};

/**
 * Normalizes text by lowercasing and stripping non-alphanumeric characters.
 * E.g. "New Town" -> "newtown", "Lake Town, South Dumdum" -> "laketownsouthdumdum"
 */
export function normalizeSearchString(val: string): string {
  return val.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Checks if a searchable item (pandal, civic utility, place) matches the user's search query.
 * Supports:
 * - Substring matching (case-insensitive)
 * - Space/punctuation insensitive matching (e.g. "newtown" matches "New Town", "saltlake" matches "Salt Lake")
 * - Multi-token matching (e.g. "new town bg block" matches all components)
 * - Locality and common Durga Puja phonetic / spelling aliases
 */
export function matchesSearchQuery(
  item: SearchableItem,
  rawQuery: string
): boolean {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return true;

  const rawFields = [
    item.name || "",
    item.locality || "",
    item.address || "",
    item.category || "",
    item.description || "",
    ...(item.facilities || []),
  ];
  const combined = rawFields.join(" ").toLowerCase();

  // 1. Direct case-insensitive substring match
  if (combined.includes(query)) return true;

  // 2. Space and punctuation normalized match
  const cleanQuery = normalizeSearchString(query);
  const cleanCombined = normalizeSearchString(combined);
  if (cleanQuery && cleanCombined.includes(cleanQuery)) return true;

  // 3. Multi-token match: every word in query must match
  const tokens = query.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    const allTokensMatch = tokens.every((token) => {
      const cleanToken = normalizeSearchString(token);
      return combined.includes(token) || (cleanToken && cleanCombined.includes(cleanToken));
    });
    if (allTokensMatch) return true;
  }

  // 4. Locality and common transliteration aliases
  const aliases: Record<string, string[]> = {
    newtown: ["new town", "rajarhat", "action area"],
    laketown: ["lake town", "sreebhumi"],
    saltlake: ["salt lake", "bidhannagar", "karunamoyee"],
    dumdum: ["dum dum"],
    bagbazar: ["baghbazar"],
    baghbazar: ["bagbazar"],
    sovabazar: ["shobhabazar", "shovabazar"],
    shobhabazar: ["sovabazar", "shovabazar"],
    shovabazar: ["sovabazar", "shobhabazar"],
    deshapriya: ["deshapriyo", "deshpriya"],
    deshapriyo: ["deshapriya"],
    chetla: ["chetla agrani"],
    tridhara: ["tridhara sammilani"],
    behala: ["behala"],
    ballygunge: ["ballygunge"],
    suruchi: ["suruchi sangha"],
    mudiali: ["mudiali"],
    jodhpur: ["jodhpur park"],
    babubagan: ["babu bagan"],
    selimpur: ["salimpur"],
    santoshpur: ["santoshpur"],
    tala: ["tala prattoy", "tala park"],
  };

  for (const [key, variants] of Object.entries(aliases)) {
    if (cleanQuery.includes(key)) {
      for (const variant of variants) {
        const cleanVar = normalizeSearchString(variant);
        if (cleanCombined.includes(cleanVar) || combined.includes(variant)) {
          return true;
        }
      }
    }
  }

  return false;
}
