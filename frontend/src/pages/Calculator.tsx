import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { useItemsQuery, useRecipesQuery, useGameDataStatsQuery } from "@/domain/gamedata/queries";
import { calculateProduction, flattenRequirements, summarizeMachines } from "@/domain/gamedata/calculator";
import { summarizePower } from "@/domain/gamedata/power";
import ProductionGraph from "@/features/calculator/ProductionGraph";
import ProductionTree from "@/features/calculator/ProductionTree";
import { MachineSummarySection, PowerSummarySection } from "@/features/calculator/MachineAndPowerSummary";
import VehiclePanel from "@/features/calculator/VehiclePanel";
import RawRequirementsTable from "@/features/calculator/RawRequirementsTable";
import SaveToPlanPanel from "@/features/calculator/SaveToPlanPanel";
import CalculatorForm, { type ViewMode } from "@/features/calculator/CalculatorForm";

const DEFAULT_BELT_TIER = "Mk.5";
const DEFAULT_PIPE_TIER = "Mk.2";

export default function CalculatorPage() {
  const { t } = useTranslation();
  const statsQuery = useGameDataStatsQuery();
  const hasData = (statsQuery.data?.item_count ?? 0) > 0;

  const itemsQuery = useItemsQuery("", hasData);
  const recipesQuery = useRecipesQuery("", hasData);

  // Deep-link prefill (W-05): /calculator?item=<id>&qty=<n> opens the calculator
  // ready to compute that item, so other pages (e.g. Game Data) can link straight in.
  const [searchParams] = useSearchParams();
  const [targetItemId, setTargetItemId] = useState(() => searchParams.get("item") ?? "");
  const [quantityRaw, setQuantityRaw] = useState(() => searchParams.get("qty") ?? "1");
  // Auto-submit when arriving via a ?item= deep link: the tree memo computes as
  // soon as game data loads, no effect needed. Manual changes reset it via onChange.
  const [submitted, setSubmitted] = useState(() => !!searchParams.get("item"));
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
  const powerSummary = useMemo(() => summarizePower(machineSummary), [machineSummary]);
  const targetStackSize = useMemo(
    () => items.find((i) => i.id === targetItemId)?.stack_size ?? 0,
    [items, targetItemId],
  );

  const isLoading = itemsQuery.isLoading || recipesQuery.isLoading || statsQuery.isLoading;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (!hasData && !isLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <h1 className="text-xl font-semibold text-foreground">{t("calculator.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("calculator.no_data")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold text-foreground">{t("calculator.title")}</h1>

      <div className="flex flex-col gap-6 lg:flex-row">
        <CalculatorForm
          sortedItems={sortedItems}
          targetItemId={targetItemId}
          onTargetItemIdChange={(value) => {
            setTargetItemId(value);
            setSubmitted(false);
          }}
          quantityRaw={quantityRaw}
          onQuantityRawChange={(value) => {
            setQuantityRaw(value);
            setSubmitted(false);
          }}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          hasTree={tree !== null}
          beltTier={beltTier}
          onBeltTierChange={setBeltTier}
          pipeTier={pipeTier}
          onPipeTierChange={setPipeTier}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {tree && (
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            {viewMode === "graph" && <ProductionGraph tree={tree} />}

            {viewMode === "tree" && (
              <>
                <ProductionTree tree={tree} beltTier={beltTier} pipeTier={pipeTier} />
                <MachineSummarySection machineSummary={machineSummary} />
                <PowerSummarySection powerSummary={powerSummary} />
                <VehiclePanel
                  rate={tree.quantity}
                  stackSize={targetStackSize}
                  isFluid={tree.transport.is_fluid}
                />
                <RawRequirementsTable flatReqs={flatReqs} beltTier={beltTier} pipeTier={pipeTier} />
              </>
            )}

            <SaveToPlanPanel
              itemId={targetItemId}
              itemName={items.find((i) => i.id === targetItemId)?.name ?? targetItemId}
              quantity={Number.parseFloat(quantityRaw)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
