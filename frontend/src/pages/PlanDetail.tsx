import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useToast } from "@/context/useToast";
import {
  usePlanQuery,
  useUpdatePlanMutation,
  useDeletePlanMutation,
  useDuplicatePlanMutation,
} from "@/domain/plans/queries";
import { useItemsQuery } from "@/domain/gamedata/queries";
import { useBlueprintsQuery } from "@/domain/blueprints/queries";
import { useGameDataStatsQuery } from "@/domain/gamedata/queries";
import type { TargetItem } from "@/domain/plans/types";
import RealVsPlanned from "@/components/plan/RealVsPlanned";
import {
  PlanDetailSkeleton,
  PlanDetailHeader,
  PlanDescriptionEditor,
  PlanTargetItemsSection,
  PlanLinkedBlueprintsSection,
  PlanViewToggle,
} from "@/features/plans";

export default function PlanDetail() {
  const { id = "" } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data: plan, isLoading, isError } = usePlanQuery(id);
  const statsQuery = useGameDataStatsQuery();
  const hasGameData = (statsQuery.data?.item_count ?? 0) > 0;
  const itemsQuery = useItemsQuery("", hasGameData);
  const blueprintsQuery = useBlueprintsQuery();

  const updateMutation = useUpdatePlanMutation(id);
  const deleteMutation = useDeletePlanMutation();
  const duplicateMutation = useDuplicatePlanMutation();

  const [view, setView] = useState<"plan" | "real">("plan");

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState("");

  const [addingItem, setAddingItem] = useState(false);
  const [newItemId, setNewItemId] = useState("");
  const [newItemQty, setNewItemQty] = useState("1");

  const [linkingBp, setLinkingBp] = useState(false);
  const [newBpName, setNewBpName] = useState("");

  if (isLoading) {
    return <PlanDetailSkeleton />;
  }

  if (isError || !plan) {
    return (
      <main className="flex flex-col gap-3 p-6">
        <p className="text-sm text-destructive">{t("error")}</p>
        <Link to="/plans" className="text-sm text-primary underline-offset-4 hover:underline">
          {t("plan_detail.back")}
        </Link>
      </main>
    );
  }

  function handleEditName() {
    setNameDraft(plan!.name);
    setEditingName(true);
  }

  function handleSaveName() {
    updateMutation.mutate(
      { name: nameDraft.trim() },
      {
        onSuccess: () => {
          setEditingName(false);
          showToast(t("toast.plan_updated"));
        },
        onError: () => showToast(t("toast.error"), "error"),
      },
    );
  }

  function handleEditDesc() {
    setDescDraft(plan!.description);
    setEditingDesc(true);
  }

  function handleSaveDesc() {
    updateMutation.mutate(
      { description: descDraft },
      {
        onSuccess: () => {
          setEditingDesc(false);
          showToast(t("toast.plan_updated"));
        },
        onError: () => showToast(t("toast.error"), "error"),
      },
    );
  }

  function handleRemoveItem(itemId: string) {
    const next = plan!.target_items.filter((ti) => ti.item_id !== itemId);
    updateMutation.mutate(
      { target_items: next },
      {
        onSuccess: () => showToast(t("toast.item_removed")),
        onError: () => showToast(t("toast.error"), "error"),
      },
    );
  }

  function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemId) return;
    const qty = parseFloat(newItemQty);
    if (isNaN(qty) || qty <= 0) return;
    const existing = plan!.target_items.find((ti) => ti.item_id === newItemId);
    let next: TargetItem[];
    if (existing) {
      next = plan!.target_items.map((ti) =>
        ti.item_id === newItemId ? { ...ti, quantity: qty } : ti,
      );
    } else {
      next = [...plan!.target_items, { item_id: newItemId, quantity: qty }];
    }
    updateMutation.mutate(
      { target_items: next },
      {
        onSuccess: () => {
          setAddingItem(false);
          setNewItemId("");
          setNewItemQty("1");
          showToast(t("toast.item_added"));
        },
        onError: () => showToast(t("toast.error"), "error"),
      },
    );
  }

  function handleUnlinkBp(bpName: string) {
    const next = plan!.linked_blueprints.filter((n) => n !== bpName);
    updateMutation.mutate(
      { linked_blueprints: next },
      {
        onSuccess: () => showToast(t("toast.blueprint_unlinked")),
        onError: () => showToast(t("toast.error"), "error"),
      },
    );
  }

  function handleLinkBp(e: React.FormEvent) {
    e.preventDefault();
    if (!newBpName) return;
    if (plan!.linked_blueprints.includes(newBpName)) {
      setLinkingBp(false);
      setNewBpName("");
      return;
    }
    const next = [...plan!.linked_blueprints, newBpName];
    updateMutation.mutate(
      { linked_blueprints: next },
      {
        onSuccess: () => {
          setLinkingBp(false);
          setNewBpName("");
          showToast(t("toast.blueprint_linked"));
        },
        onError: () => showToast(t("toast.error"), "error"),
      },
    );
  }

  function handleDelete() {
    if (!globalThis.confirm(t("plan_detail.confirm_delete", { name: plan!.name }))) return;
    deleteMutation.mutate(id, {
      onSuccess: () => {
        showToast(t("toast.plan_deleted"));
        navigate("/plans");
      },
      onError: () => showToast(t("toast.error"), "error"),
    });
  }

  function handleDuplicate() {
    duplicateMutation.mutate(id, {
      onSuccess: (copy) => {
        showToast(t("toast.plan_duplicated"));
        navigate(`/plans/${copy.id}`);
      },
      onError: () => showToast(t("toast.error"), "error"),
    });
  }

  function handleExportJson() {
    const blob = new Blob([JSON.stringify(plan, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plan-${plan!.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(t("toast.export_done"));
  }

  const items = itemsQuery.data ?? [];
  const blueprints = blueprintsQuery.data?.blueprints ?? [];
  const availableBps = blueprints.filter((bp) => !plan.linked_blueprints.includes(bp.name));

  function itemName(itemId: string) {
    return items.find((it) => it.id === itemId)?.name ?? itemId;
  }

  return (
    <main className="flex flex-col gap-4 p-6">
      <PlanDetailHeader
        planName={plan.name}
        editingName={editingName}
        nameDraft={nameDraft}
        onNameDraftChange={setNameDraft}
        onEditName={handleEditName}
        onSaveName={handleSaveName}
        onCancelName={() => setEditingName(false)}
        isSaving={updateMutation.isPending}
        onDuplicate={handleDuplicate}
        isDuplicating={duplicateMutation.isPending}
        onExportJson={handleExportJson}
        onDelete={handleDelete}
        isDeleting={deleteMutation.isPending}
      />

      <PlanViewToggle view={view} onViewChange={setView} />

      <PlanDescriptionEditor
        description={plan.description}
        editing={editingDesc}
        draft={descDraft}
        onDraftChange={setDescDraft}
        onEdit={handleEditDesc}
        onSave={handleSaveDesc}
        onCancel={() => setEditingDesc(false)}
        isSaving={updateMutation.isPending}
      />

      {view === "plan" && (
        <div role="tabpanel" id="tabpanel-plan" aria-labelledby="tab-plan" className="flex flex-col gap-4">
          <PlanTargetItemsSection
            targetItems={plan.target_items}
            itemOptions={items}
            itemName={itemName}
            adding={addingItem}
            onStartAdd={() => setAddingItem(true)}
            onCancelAdd={() => {
              setAddingItem(false);
              setNewItemId("");
              setNewItemQty("1");
            }}
            newItemId={newItemId}
            onNewItemIdChange={setNewItemId}
            newItemQty={newItemQty}
            onNewItemQtyChange={setNewItemQty}
            onSubmitAdd={handleAddItem}
            onRemoveItem={handleRemoveItem}
            isSaving={updateMutation.isPending}
          />

          <PlanLinkedBlueprintsSection
            linkedBlueprints={plan.linked_blueprints}
            availableBlueprints={availableBps}
            linking={linkingBp}
            onStartLink={() => setLinkingBp(true)}
            onCancelLink={() => {
              setLinkingBp(false);
              setNewBpName("");
            }}
            newBpName={newBpName}
            onNewBpNameChange={setNewBpName}
            onSubmitLink={handleLinkBp}
            onUnlink={handleUnlinkBp}
            isSaving={updateMutation.isPending}
          />
        </div>
      )}

      <div role="tabpanel" id="tabpanel-real" aria-labelledby="tab-real" hidden={view !== "real"}>
        <RealVsPlanned targetItems={plan.target_items} />
      </div>
    </main>
  );
}
