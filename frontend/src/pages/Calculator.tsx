import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useItemsQuery, useRecipesQuery, useGameDataStatsQuery } from "../domain/gamedata/queries";
import { calculateProduction, flattenRequirements } from "../domain/gamedata/calculator";
import type { CalculationNode } from "../domain/gamedata/calculator";
import ProductionGraph from "../features/calculator/ProductionGraph";
import SaveToPlanPanel from "../features/calculator/SaveToPlanPanel";
import styles from "./Calculator.module.scss";

type ViewMode = "tree" | "graph";

// ── Tree node (recursive) ────────────────────────────────────────────────────

function TreeNode({ node, depth }: { readonly node: CalculationNode; readonly depth: number }) {
  const isRaw = node.children.length === 0 && node.recipe_id === null;
  return (
    <li>
      <div className={styles.treeRow}>
        <span className={isRaw ? styles.rawLabel : styles.itemLabel}>{node.item_name}</span>
        <span className={styles.qty}>{formatQty(node.quantity)}</span>
        {node.recipe_name && <span className={styles.recipe}>via {node.recipe_name}</span>}
        {isRaw && <span className={styles.rawBadge}>raw</span>}
      </div>
      {node.children.length > 0 && (
        <ul className={styles.treeList}>
          {node.children.map((child) => (
            <TreeNode key={`${child.item_id}-${depth}`} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

function formatQty(n: number): string {
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CalculatorPage() {
  const { t } = useTranslation();
  const statsQuery = useGameDataStatsQuery();
  const hasData = (statsQuery.data?.item_count ?? 0) > 0;

  const itemsQuery = useItemsQuery("", hasData);
  const recipesQuery = useRecipesQuery("", hasData);

  const [targetItemId, setTargetItemId] = useState("");
  const [quantityRaw, setQuantityRaw] = useState("1");
  const [submitted, setSubmitted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("tree");

  const items = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data]);
  const recipes = useMemo(() => recipesQuery.data ?? [], [recipesQuery.data]);

  // keep items sorted by name for the select list
  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.name.localeCompare(b.name)),
    [items],
  );

  const tree = useMemo(() => {
    if (!submitted || !targetItemId || !hasData) return null;
    const qty = Number.parseFloat(quantityRaw);
    if (!Number.isFinite(qty) || qty <= 0) return null;
    return calculateProduction(targetItemId, qty, recipes, items);
  }, [submitted, targetItemId, quantityRaw, recipes, items, hasData]);

  const flatReqs = useMemo(() => (tree ? flattenRequirements(tree) : []), [tree]);

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  const isLoading = itemsQuery.isLoading || recipesQuery.isLoading || statsQuery.isLoading;

  if (!hasData && !isLoading) {
    return (
      <div className={styles.page}>
        <h1>{t("calculator.title")}</h1>
        <p className={styles.noData}>{t("calculator.no_data")}</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1>{t("calculator.title")}</h1>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.label} htmlFor="calc-item">
          {t("calculator.target_item")}
        </label>
        <select
          id="calc-item"
          className={styles.select}
          value={targetItemId}
          onChange={(e) => { setTargetItemId(e.target.value); setSubmitted(false); }}
          required
          disabled={isLoading}
        >
          <option value="" disabled>
            {isLoading ? t("calculator.loading") : t("calculator.select_placeholder")}
          </option>
          {sortedItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>

        <label className={styles.label} htmlFor="calc-qty">
          {t("calculator.quantity")}
        </label>
        <input
          id="calc-qty"
          type="number"
          className={styles.input}
          value={quantityRaw}
          min="0.01"
          step="any"
          onChange={(e) => { setQuantityRaw(e.target.value); setSubmitted(false); }}
          required
        />

        <button type="submit" className={styles.submitBtn} disabled={isLoading || !targetItemId}>
          {t("calculator.calculate")}
        </button>
      </form>

      {tree && (
        <div className={styles.results}>
          <div className={styles.viewToggle}>
            <button
              type="button"
              className={`${styles.toggleBtn} ${viewMode === "tree" ? styles.active : ""}`}
              onClick={() => { setViewMode("tree"); }}
            >
              {t("calculator.view_tree")}
            </button>
            <button
              type="button"
              className={`${styles.toggleBtn} ${viewMode === "graph" ? styles.active : ""}`}
              onClick={() => { setViewMode("graph"); }}
            >
              {t("calculator.view_graph")}
            </button>
          </div>

          {viewMode === "graph" && <ProductionGraph tree={tree} />}

          {viewMode === "tree" && (
            <section className={styles.section}>
              <h2>{t("calculator.production_tree")}</h2>
              <ul className={styles.treeList}>
                <TreeNode node={tree} depth={0} />
              </ul>
            </section>
          )}

          {viewMode === "tree" && flatReqs.length > 0 && (
            <section className={styles.section}>
              <h2>{t("calculator.raw_requirements")}</h2>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{t("calculator.col_item")}</th>
                    <th>{t("calculator.col_quantity")}</th>
                    <th>{t("calculator.col_type")}</th>
                  </tr>
                </thead>
                <tbody>
                  {flatReqs.map((req) => (
                    <tr key={req.item_id} className={req.is_raw ? styles.rawRow : undefined}>
                      <td>{req.item_name}</td>
                      <td className={styles.qtyCell}>{formatQty(req.quantity)}</td>
                      <td>{req.is_raw ? t("calculator.type_raw") : t("calculator.type_intermediate")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          <SaveToPlanPanel
            itemId={targetItemId}
            itemName={items.find((i) => i.id === targetItemId)?.name ?? targetItemId}
            quantity={Number.parseFloat(quantityRaw)}
          />
        </div>
      )}
    </div>
  );
}
