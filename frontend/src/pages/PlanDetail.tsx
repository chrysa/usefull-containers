import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  usePlanQuery,
  useUpdatePlanMutation,
  useDeletePlanMutation,
  useDuplicatePlanMutation,
} from "../domain/plans/queries";
import { useItemsQuery } from "../domain/gamedata/queries";
import { useBlueprintsQuery } from "../domain/blueprints/queries";
import { useGameDataStatsQuery } from "../domain/gamedata/queries";
import type { TargetItem } from "../domain/plans/types";
import Skeleton from "../components/ui/Skeleton";
import styles from "./PlanDetail.module.scss";

export default function PlanDetail() {
  const { id = "" } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: plan, isLoading, isError } = usePlanQuery(id);
  const statsQuery = useGameDataStatsQuery();
  const hasGameData = (statsQuery.data?.item_count ?? 0) > 0;
  const itemsQuery = useItemsQuery("", hasGameData);
  const blueprintsQuery = useBlueprintsQuery();

  const updateMutation = useUpdatePlanMutation(id);
  const deleteMutation = useDeletePlanMutation();
  const duplicateMutation = useDuplicatePlanMutation();

  // Inline name/description editing
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState("");

  // Add target item form
  const [addingItem, setAddingItem] = useState(false);
  const [newItemId, setNewItemId] = useState("");
  const [newItemQty, setNewItemQty] = useState("1");

  // Link blueprint form
  const [linkingBp, setLinkingBp] = useState(false);
  const [newBpName, setNewBpName] = useState("");

  if (isLoading) {
    return (
      <main className={styles.page}>
        <div className={styles.breadcrumb}>
          <Skeleton width="60px" height="13px" />
          <span className={styles.sep}>/</span>
          <Skeleton width="140px" height="13px" />
        </div>
        <header className={styles.header}>
          <Skeleton width="260px" height="32px" />
        </header>
        <Skeleton width="100%" height="56px" radius="6px" />
        <section className={styles.section}>
          <Skeleton width="120px" height="18px" />
          <div className={styles.skeletonList}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} height="44px" radius="6px" />
            ))}
          </div>
        </section>
        <section className={styles.section}>
          <Skeleton width="150px" height="18px" />
          <div className={styles.skeletonList}>
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} height="44px" radius="6px" />
            ))}
          </div>
        </section>
      </main>
    );
  }

  if (isError || !plan) {
    return (
      <main className={styles.page}>
        <p className={styles.error}>{t("error")}</p>
        <Link to="/plans" className={styles.back}>
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
        onSuccess: () => setEditingName(false),
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
        onSuccess: () => setEditingDesc(false),
      },
    );
  }

  function handleRemoveItem(itemId: string) {
    const next = plan!.target_items.filter((ti) => ti.item_id !== itemId);
    updateMutation.mutate({ target_items: next });
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
        },
      },
    );
  }

  function handleUnlinkBp(bpName: string) {
    const next = plan!.linked_blueprints.filter((n) => n !== bpName);
    updateMutation.mutate({ linked_blueprints: next });
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
        },
      },
    );
  }

  function handleDelete() {
    if (
      !globalThis.confirm(t("plan_detail.confirm_delete", { name: plan!.name }))
    )
      return;
    deleteMutation.mutate(id, {
      onSuccess: () => navigate("/plans"),
    });
  }

  function handleDuplicate() {
    duplicateMutation.mutate(id, {
      onSuccess: (copy) => navigate(`/plans/${copy.id}`),
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
  }

  const items = itemsQuery.data ?? [];
  const blueprints = blueprintsQuery.data?.blueprints ?? [];
  const availableBps = blueprints.filter(
    (bp) => !plan.linked_blueprints.includes(bp.name),
  );

  function itemName(itemId: string) {
    return items.find((it) => it.id === itemId)?.name ?? itemId;
  }

  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="breadcrumb">
        <Link to="/plans">{t("nav.plans")}</Link>
        <span className={styles.sep} aria-hidden="true">
          /
        </span>
        <span>{plan.name}</span>
      </nav>

      {/* ── Name ─────────────────────────────────────────────────────── */}
      <header className={styles.header}>
        {editingName ? (
          <div className={styles.inlineEdit}>
            <input
              className={styles.inlineInput}
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              maxLength={200}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveName();
                if (e.key === "Escape") setEditingName(false);
              }}
            />
            <button
              type="button"
              className={styles.btnSave}
              onClick={handleSaveName}
              disabled={updateMutation.isPending || !nameDraft.trim()}
            >
              {t("plan_detail.save")}
            </button>
            <button
              type="button"
              className={styles.btnCancel}
              onClick={() => setEditingName(false)}
            >
              {t("plan_detail.cancel")}
            </button>
          </div>
        ) : (
          <div className={styles.titleRow}>
            <h1 className={styles.name}>{plan.name}</h1>
            <button
              type="button"
              className={styles.btnEdit}
              onClick={handleEditName}
              aria-label={t("plan_detail.edit_name")}
            >
              {t("plan_detail.edit")}
            </button>
            <button
              type="button"
              className={styles.btnDuplicate}
              onClick={handleDuplicate}
              disabled={duplicateMutation.isPending}
            >
              {t("plan_detail.duplicate")}
            </button>
            <button
              type="button"
              className={styles.btnExport}
              onClick={handleExportJson}
            >
              {t("plan_detail.export_json")}
            </button>
            <button
              type="button"
              className={styles.btnDelete}
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {t("plan_detail.delete")}
            </button>
          </div>
        )}
      </header>

      {/* ── Description ──────────────────────────────────────────────── */}
      <section className={styles.descSection}>
        {editingDesc ? (
          <div className={styles.inlineEdit}>
            <textarea
              className={styles.inlineTextarea}
              value={descDraft}
              rows={3}
              onChange={(e) => setDescDraft(e.target.value)}
              autoFocus
            />
            <div className={styles.inlineActions}>
              <button
                type="button"
                className={styles.btnSave}
                onClick={handleSaveDesc}
                disabled={updateMutation.isPending}
              >
                {t("plan_detail.save")}
              </button>
              <button
                type="button"
                className={styles.btnCancel}
                onClick={() => setEditingDesc(false)}
              >
                {t("plan_detail.cancel")}
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.descRow}>
            <p className={styles.desc}>
              {plan.description || (
                <em className={styles.empty}>
                  {t("plan_detail.no_description")}
                </em>
              )}
            </p>
            <button
              type="button"
              className={styles.btnEditSmall}
              onClick={handleEditDesc}
              aria-label={t("plan_detail.edit_desc")}
            >
              {t("plan_detail.edit")}
            </button>
          </div>
        )}
      </section>

      {/* ── Target items ─────────────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            {t("plan_detail.target_items")}
          </h2>
          {!addingItem && (
            <button
              type="button"
              className={styles.btnAdd}
              onClick={() => setAddingItem(true)}
            >
              + {t("plan_detail.add_item")}
            </button>
          )}
        </div>

        {addingItem && (
          <form className={styles.addForm} onSubmit={handleAddItem}>
            <select
              className={styles.select}
              value={newItemId}
              onChange={(e) => setNewItemId(e.target.value)}
              required
            >
              <option value="">{t("plan_detail.select_item")}</option>
              {items.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.name}
                </option>
              ))}
            </select>
            <input
              className={styles.qtyInput}
              type="number"
              min="0.01"
              step="0.01"
              value={newItemQty}
              onChange={(e) => setNewItemQty(e.target.value)}
              required
              aria-label={t("plan_detail.quantity")}
            />
            <span className={styles.qtyUnit}>/min</span>
            <button
              type="submit"
              className={styles.btnSave}
              disabled={updateMutation.isPending || !newItemId}
            >
              {t("plan_detail.add")}
            </button>
            <button
              type="button"
              className={styles.btnCancel}
              onClick={() => {
                setAddingItem(false);
                setNewItemId("");
                setNewItemQty("1");
              }}
            >
              {t("plan_detail.cancel")}
            </button>
          </form>
        )}

        {plan.target_items.length === 0 && !addingItem && (
          <p className={styles.emptyHint}>{t("plan_detail.no_items")}</p>
        )}

        {plan.target_items.length > 0 && (
          <ul className={styles.itemList}>
            {plan.target_items.map((ti) => (
              <li key={ti.item_id} className={styles.itemRow}>
                <span className={styles.itemName}>{itemName(ti.item_id)}</span>
                <span className={styles.itemQty}>
                  {ti.quantity}
                  <span className={styles.unit}>/min</span>
                </span>
                <button
                  type="button"
                  className={styles.btnRemove}
                  onClick={() => handleRemoveItem(ti.item_id)}
                  disabled={updateMutation.isPending}
                  aria-label={t("plan_detail.remove_item", {
                    name: itemName(ti.item_id),
                  })}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Linked blueprints ─────────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            {t("plan_detail.linked_blueprints")}
          </h2>
          {!linkingBp && availableBps.length > 0 && (
            <button
              type="button"
              className={styles.btnAdd}
              onClick={() => setLinkingBp(true)}
            >
              + {t("plan_detail.link_blueprint")}
            </button>
          )}
        </div>

        {linkingBp && (
          <form className={styles.addForm} onSubmit={handleLinkBp}>
            <select
              className={styles.select}
              value={newBpName}
              onChange={(e) => setNewBpName(e.target.value)}
              required
            >
              <option value="">{t("plan_detail.select_blueprint")}</option>
              {availableBps.map((bp) => (
                <option key={bp.name} value={bp.name}>
                  {bp.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className={styles.btnSave}
              disabled={updateMutation.isPending || !newBpName}
            >
              {t("plan_detail.link")}
            </button>
            <button
              type="button"
              className={styles.btnCancel}
              onClick={() => {
                setLinkingBp(false);
                setNewBpName("");
              }}
            >
              {t("plan_detail.cancel")}
            </button>
          </form>
        )}

        {plan.linked_blueprints.length === 0 && !linkingBp && (
          <p className={styles.emptyHint}>{t("plan_detail.no_blueprints")}</p>
        )}

        {plan.linked_blueprints.length > 0 && (
          <ul className={styles.itemList}>
            {plan.linked_blueprints.map((bpName) => (
              <li key={bpName} className={styles.itemRow}>
                <Link
                  to={`/blueprints/${encodeURIComponent(bpName)}`}
                  className={styles.bpLink}
                >
                  {bpName}
                </Link>
                <button
                  type="button"
                  className={styles.btnRemove}
                  onClick={() => handleUnlinkBp(bpName)}
                  disabled={updateMutation.isPending}
                  aria-label={t("plan_detail.unlink_blueprint", {
                    name: bpName,
                  })}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
