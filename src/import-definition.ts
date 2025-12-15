export type ImportDefinition = {
  /** Random string */
  id: string;
  /** The module specifier to import from */
  specifier: string;
  /** The names of the imports */
  names: string;
};

export function getImportsFromQuery(query: string): ImportDefinition[] | undefined {
  const params = new URLSearchParams(query);
  const imports: ImportDefinition[] = [];
  for (const value of params.getAll("i")) {
    const [specifier, ...names] = value.split("|");
    if (specifier) {
      imports.push({
        id: crypto.randomUUID(),
        specifier,
        names: names.join("|"),
      });
    }
  }
  return imports.length > 0 ? imports : undefined;
}
export function storeImportsToQuery(imports: ImportDefinition[]): void {
  const params = new URLSearchParams(window.location.search);
  params.delete("i");
  for (const imp of imports) {
    params.append("i", `${imp.specifier}|${imp.names}`);
  }
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState(null, "", newUrl);
}
