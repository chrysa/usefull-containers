import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useItemsQuery, useRecipesQuery, useGameDataStatsQuery } from "../domain/gamedata/queries";
import { calculateProduction, flattenRequirements, summarizeMachines } from "../domain/gamedata/calculator";
import type { CalculationNode } from "../domain/gamedata/calculator";
import {
  BELT_TIERS,
  PIPE_TIERS,
  countForTier,
  transportRequirement,
  type TransportRequirement,
} from "../domain/gamedata/logistics";
import ProductionGraph from "../features/calculator/ProductionGraph";
import SaveToPlanPanel from "../features/calculator/SaveToPlanPanel";
import styles from "./Calculator.module.scss";

type ViewMode = "tree" | "graph";

const DEFAULT_BELT_TIER = "Mk.5";
const DEFAULT_PIPE_TIER = "Mk.2";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatQty(n: number): string {
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}

/** "Desc_ConstructorMk1_C" → "Constructor Mk.1". */
function prettifyMachine(id: string): string {
  if (!id || id === "unknown") return "—";
  return id
    .replace(/^Desc_/, "")
    .replace(/_C$/, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/Mk(\d)/, "Mk.$1");
}

// ── Transport badge ────────────────────────────────────────────────────────────

function TransportBadge({
  transport,
  beltTier,
  pipeTier,
}: {
  readonly transport: TransportRequirement;
  readonly beltTier: string;
  readonly pipeTier: string;
}) {
  const { t } = useTranslation();
  if (transport.rate <= 0) return null;
  const selectedTier = transport.is_fluid ? pipeTier : beltTier;
  const count = countForTier(transport, selectedTier);
  const kind = transport.is_fluid ? t("calculator.unit_pipe") : t("calculator.unit_belt");
  const overTopTier = transport.min_single_tier === null;
  const detail =
    transport.min_single_tier && transport.min_single_tier !== selectedTier
      ? ` (${t("calculator.min_tier", { tier: transport.min_single_tier })})`
      : "";

  return (
    <span
      className={`${styles.transportBadge} ${transport.is_fluid ? styles.transportBadgeFluid : ""} ${overTopTier ? styles.transportOver : ""}`}
      title={`${formatQty(transport.rate)}/min · ${kind} ${selectedTier}${detail}`}
    >
      {count}× {kind} {selectedTier}
      {detail}
    </span>
  );
}

// ── Tree node (recursive) ────────────────────────────────────────────────────

function TreeNode({
  node,
  depth,
  beltTier,
  pipeTier,
}: {
  readonly node: CalculationNode;
  readonly depth: number;
  readonly beltTier: string;
  readonly pipeTier: string;
}) {
  const { t } = useTranslation();
  const isRaw = node.children.length === 0 && node.recipe_id === null;
  return (
    <li>
      <div className={styles.treeRow}>
        <span className={isRaw ? styles.rawLabel : styles.itemLabel}>{node.item_name}</span>
        <span className={styles.qty}>{formatQty(node.quantity)}</span>
        {node.recipe_name && <span className={styles.recipe}>via {node.recipe_name}</span>}
        {node.machines && node.machines.count > 0 && (
          <span
            className={styles.machineBadge}
            title={`${prettifyMachine(node.machines.machine_id)} · ${node.machines.exact.toFixed(2)} ${t("calculator.machines_label")} @ ${node.machines.clock_percent.toFixed(0)}%`}
          >
            ×{node.machines.count} {prettifyMachine(node.machines.machine_id)}
          </span>
        )}
        <TransportBadge transport={node.transport} beltTier={beltTier} pipeTier={pipeTier} />
        {isRaw && <span className={styles.rawBadge}>raw</span>}
      </div>
      {node.children.length > 0 && (
        <ul className={styles.treeList}>
          {node.children.map((child) => (
            <TreeNode
              key={`${child.item_id}-${depth}`}
              node={child}
              depth={depth + 1}
              beltTier={beltTier}
              pipeTier={pipeTier}
            />
          ))}
        </ul>
      )}
    </li>
  );
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
  const [beltTier, setBeltTier] = useState(DEFAULT_BELT_TIER);
  const [pipeTier, setPipeTier] = useState(DEFAULT_PIPE_TIER);

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
  const machineSummary = useMemo(() => (tree ? summarizeMachines(tree) : []), [tree]);

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
          <div className={styles.tierBar}>
            <div className={styles.tierField}>
              <label htmlFor="belt-tier">{t("calculator.belt_tier")}</label>
              <select
                id="belt-tier"
                value={beltTier}
                onChange={(e) => { setBeltTier(e.target.value); }}
              >
                {BELT_TIERS.map((tier) => (
                  <option key={tier.id} value={tier.id}>
                    {tier.id} — {tier.capacity}/min
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.tierField}>
              <label htmlFor="pipe-tier">{t("calculator.pipe_tier")}</label>
              <select
                id="pipe-tier"
                value={pipeTier}
                onChange={(e) => { setPipeTier(e.target.value); }}
              >
                {PIPE_TIERS.map((tier) => (
                  <option key={tier.id} value={tier.id}>
                    {tier.id} — {tier.capacity}/min
                  </option>
                ))}
              </select>
            </div>
          </div>

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
                <TreeNode node={tree} depth={0} beltTier={beltTier} pipeTier={pipeTier} />
              </ul>
            </section>
          )}

          {viewMode === "tree" && machineSummary.length > 0 && (
            <section className={styles.section}>
              <h2>{t("calculator.machine_summary")}</h2>
              <div className={styles.machineGrid}>
                {machineSummary.map((m) => (
                  <div key={m.machine_id} className={styles.machineChip}>
                    <span className={styles.machineChipCount}>{m.total_machines}</span>
                    <span className={styles.machineChipName}>{prettifyMachine(m.machine_id)}</span>
                  </div>
                ))}
              </div>
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
                    <th>{t("calculator.col_transport")}</th>
                    <th>{t("calculator.col_type")}</th>
                  </tr>
                </thead>
                <tbody>
                  {flatReqs.map((req) => {
                    const transport = transportRequirement(req.quantity, req.is_fluid);
                    return (
                      <tr key={req.item_id} className={req.is_raw ? styles.rawRow : undefined}>
                        <td>{req.item_name}</td>
                        <td className={styles.qtyCell}>{formatQty(req.quantity)}</td>
                        <td>
                          <TransportBadge transport={transport} beltTier={beltTier} pipeTier={pipeTier} />
                        </td>
                        <td>{req.is_raw ? t("calculator.type_raw") : t("calculator.type_intermediate")}</td>
                      </tr>
                    );
                  })}
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
