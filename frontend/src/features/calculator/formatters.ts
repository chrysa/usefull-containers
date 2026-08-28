/** Display formatting helpers shared across the calculator page components. */

/** Formats a quantity, keeping two decimals only when the value is not an integer. */
export function formatQty(n: number): string {
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}

/** "Desc_ConstructorMk1_C" → "Constructor Mk.1". */
export function prettifyMachine(id: string): string {
  if (!id || id === "unknown") return "—";
  return id
    .replace(/^Desc_/, "")
    .replace(/_C$/, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/Mk(\d)/, "Mk.$1");
}
