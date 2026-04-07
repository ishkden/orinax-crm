"use client";

import { useState, useMemo, useEffect, useCallback, useTransition } from "react";
import DealsToolbar, { type ViewMode } from "./DealsToolbar";
import KanbanBoard from "./KanbanBoard";
import DealsListView from "./DealsListView";
import CreateDealModal from "./CreateDealModal";
import ContactDrawer from "./ContactDrawer";
import DealRightDrawer from "./DealRightDrawer";
import { useCrmHeaderAction } from "@/components/crm/CrmHeaderActionContext";
import { useCrmDealPipeline } from "@/components/crm/CrmDealPipelineContext";
import type { DbPipeline } from "@/app/actions/deals";
import type { Deal, CreateDealInput, Stage, Pipeline } from "./types";
import type { CustomFieldDef } from "@/app/actions/custom-fields";
import {
  updateDealStage,
  createDeal,
  deleteStage,
  getDealsPage,
  reorderStages,
  createStage,
} from "@/app/actions/deals";
import { updateStageSettings } from "@/app/actions/pipeline-settings";

const DEFAULT_STAGE_COLOR = "#6B7280";

export type StagePaginationState = Record<
  string,
  { page: number; total: number; loading: boolean }
>;

interface DealsClientProps {
  initialDealsByStage: Record<string, { items: Deal[]; total: number }>;
  initialPipelines: DbPipeline[];
  serverStageTotals?: Record<string, { amount: number; currency: string }>;
  customFields?: CustomFieldDef[];
}

function mapDbToUiPipelines(dbPipelines: DbPipeline[]): Pipeline[] {
  return dbPipelines.map((p) => ({
    id: p.id,
    label: p.name,
    stages: p.stages.map((s) => ({
      id: s.id,
      label: s.name,
      color: s.color ?? DEFAULT_STAGE_COLOR,
    })),
  }));
}

export default function DealsClient({
  initialDealsByStage,
  initialPipelines,
  serverStageTotals: initialServerStageTotals = {},
  customFields = [],
}: DealsClientProps) {
  const { setHeaderAction } = useCrmHeaderAction();
  const { setPipeline } = useCrmDealPipeline();

  const [pipelines, setPipelines] = useState(() => mapDbToUiPipelines(initialPipelines));

  const [deals, setDeals] = useState<Deal[]>(() =>
    Object.values(initialDealsByStage).flatMap(({ items }) => items)
  );

  const [stagePagination, setStagePagination] = useState<StagePaginationState>(() =>
    Object.fromEntries(
      Object.entries(initialDealsByStage).map(([stageId, { items, total }]) => [
        stageId,
        { page: 1, total, loading: false },
      ])
    )
  );

  const [stageTotals, setStageTotals] = useState<Record<string, { amount: number; currency: string }>>(
    initialServerStageTotals
  );

  const [activePipelineId, setActivePipelineId] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("crm_active_pipeline_id");
      if (saved && pipelines.some((p) => p.id === saved)) return saved;
    }
    return pipelines[0]?.id ?? "";
  });
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<Deal["priority"] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStage, setModalStage] = useState<string | null>(null);
  const [stageOrderMap, setStageOrderMap] = useState<Record<string, string[]>>({});
  const [contactDeal, setContactDeal] = useState<Deal | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [, startTransition] = useTransition();

  // Restore selected deal if page loaded at /crm/deals/:id
  useEffect(() => {
    const match = window.location.pathname.match(/\/crm\/deals\/(\d+)/);
    if (match && deals.length > 0) {
      const found = deals.find((d) => String(d.serialNumber) === match[1]);
      if (found) {
        setSelectedDeal(found);
        window.history.replaceState({ dealSN: found.serialNumber }, "", window.location.href);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle browser back/forward: sync drawer with URL
  useEffect(() => {
    function onPopState() {
      const match = window.location.pathname.match(/\/crm\/deals\/(\d+)/);
      if (match) {
        const found = deals.find((d) => String(d.serialNumber) === match[1]);
        setSelectedDeal(found ?? null);
      } else {
        setSelectedDeal(null);
      }
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [deals]);

  const handleDealClick = useCallback((deal: Deal) => {
    setSelectedDeal(deal);
    window.history.pushState({ dealSN: deal.serialNumber }, "", `/crm/deals/${deal.serialNumber}`);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setSelectedDeal(null);
    window.history.replaceState({}, "", "/crm/deals");
  }, []);

  const openCreateDeal = useCallback(() => {
    setModalStage(null);
    setModalOpen(true);
  }, []);

  useEffect(() => {
    setHeaderAction({ label: "Добавить сделку", onClick: openCreateDeal });
    return () => setHeaderAction(null);
  }, [setHeaderAction, openCreateDeal]);

  useEffect(() => {
    if (activePipelineId) {
      localStorage.setItem("crm_active_pipeline_id", activePipelineId);
    }
  }, [activePipelineId]);

  useEffect(() => {
    if (pipelines.length > 0) {
      setPipeline({ pipelines, activePipelineId, onPipelineChange: setActivePipelineId });
    }
    return () => setPipeline(null);
  }, [setPipeline, pipelines, activePipelineId]);

  const activePipeline = useMemo((): Pipeline => {
    const p = pipelines.find((x) => x.id === activePipelineId) ?? pipelines[0];
    if (!p) return { id: "", label: "", stages: [] };
    const localOrder = stageOrderMap[p.id];
    let stages = [...p.stages];
    if (localOrder) {
      const stageById = Object.fromEntries(stages.map((s) => [s.id, s]));
      stages = localOrder.map((id) => stageById[id]).filter(Boolean) as Stage[];
    }
    return { ...p, stages };
  }, [pipelines, activePipelineId, stageOrderMap]);

  const assignees = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const d of deals) {
      if (d.assignee && !seen.has(d.assignee)) {
        seen.add(d.assignee);
        result.push(d.assignee);
      }
    }
    return result;
  }, [deals]);

  const filteredDeals = useMemo(() => {
    let result = deals;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          (d.company ?? "").toLowerCase().includes(q) ||
          d.contactName.toLowerCase().includes(q)
      );
    }
    if (filterAssignee) {
      result = result.filter((d) => d.assignee === filterAssignee);
    }
    if (filterPriority) {
      result = result.filter((d) => d.priority === filterPriority);
    }
    return result;
  }, [deals, searchQuery, filterAssignee, filterPriority]);

  const handleLoadMore = useCallback(async (stageId: string) => {
    const p = stagePagination[stageId];
    if (!p || p.loading) return;
    const loadedCount = deals.filter((d) => d.stage === stageId).length;
    if (loadedCount >= p.total) return;

    setStagePagination((prev) => ({
      ...prev,
      [stageId]: { ...prev[stageId], loading: true },
    }));

    try {
      const nextPage = p.page + 1;
      const result = await getDealsPage(stageId, nextPage, 20);
      setDeals((prev) => {
        const existingIds = new Set(prev.map((d) => d.id));
        const newItems = result.items.filter((d) => !existingIds.has(d.id));
        return [...prev, ...newItems];
      });
      setStagePagination((prev) => ({
        ...prev,
        [stageId]: { page: nextPage, total: result.total, loading: false },
      }));
    } catch {
      setStagePagination((prev) => ({
        ...prev,
        [stageId]: { ...prev[stageId], loading: false },
      }));
    }
  }, [stagePagination, deals]);

  const handleStageUpdate = useCallback(
    (stageId: string, updates: { label?: string; color?: string }) => {
      setPipelines((prev) =>
        prev.map((p) => ({
          ...p,
          stages: p.stages.map((s) =>
            s.id === stageId
              ? { ...s, label: updates.label ?? s.label, color: updates.color ?? s.color }
              : s
          ),
        }))
      );
      startTransition(() => {
        const dbUpdates: { name?: string; color?: string } = {};
        if (updates.label) dbUpdates.name = updates.label;
        if (updates.color) dbUpdates.color = updates.color;
        updateStageSettings(stageId, dbUpdates).catch(() => {
          setPipelines(mapDbToUiPipelines(initialPipelines));
        });
      });
    },
    [initialPipelines]
  );

  function handleMoveDeal(dealId: string, newStage: string) {
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d))
    );
  }

  function handleStageCommit(dealId: string, newStage: string, previousStage: string) {
    if (newStage === previousStage) return;
    const deal = deals.find((d) => d.id === dealId);
    const dealValue = deal?.value ?? 0;
    const dealCurrency = deal?.currency ?? "RUB";

    setStageTotals((prev) => {
      const result = { ...prev };
      if (result[previousStage]) {
        result[previousStage] = { ...result[previousStage], amount: result[previousStage].amount - dealValue };
      }
      if (result[newStage]) {
        result[newStage] = { ...result[newStage], amount: result[newStage].amount + dealValue };
      } else {
        result[newStage] = { amount: dealValue, currency: dealCurrency };
      }
      return result;
    });

    startTransition(() => {
      updateDealStage(dealId, newStage).catch(() => {
        setDeals((prev) =>
          prev.map((d) => (d.id === dealId ? { ...d, stage: previousStage } : d))
        );
        setStageTotals((prev) => {
          const result = { ...prev };
          if (result[newStage]) {
            result[newStage] = { ...result[newStage], amount: result[newStage].amount - dealValue };
          }
          if (result[previousStage]) {
            result[previousStage] = { ...result[previousStage], amount: result[previousStage].amount + dealValue };
          }
          return result;
        });
      });
    });
  }

  function handleStageDelete(stageId: string) {
    startTransition(async () => {
      try {
        await deleteStage(stageId);
        window.location.reload();
      } catch (err) {
        console.error("Failed to delete stage:", err);
      }
    });
  }

  function handleStageReorder(newStageIds: string[]) {
    const previousOrder = stageOrderMap[activePipelineId] ??
      (pipelines.find((p) => p.id === activePipelineId)?.stages.map((s) => s.id) ?? []);
    setStageOrderMap((prev) => ({ ...prev, [activePipelineId]: newStageIds }));
    startTransition(() => {
      reorderStages(newStageIds).catch(() => {
        setStageOrderMap((prev) => ({ ...prev, [activePipelineId]: previousOrder }));
      });
    });
  }

  function handleAddStageAfter(afterStageId: string) {
    const pipeline = initialPipelines.find((p) => p.id === activePipelineId);
    if (!pipeline) return;
    const afterStage = pipeline.stages.find((s) => s.id === afterStageId);
    if (!afterStage) return;
    startTransition(async () => {
      try {
        await createStage(pipeline.id, afterStage.sortOrder, "Новая стадия", DEFAULT_STAGE_COLOR);
        window.location.reload();
      } catch (err) {
        console.error("Failed to create stage:", err);
      }
    });
  }

  function handleAddDeal(stageId: string) {
    setModalStage(stageId);
    setModalOpen(true);
  }

  async function handleCreateDeal(input: CreateDealInput) {
    const stageToUse = modalStage ?? input.stage;
    try {
      const newDeal = await createDeal({ ...input, stage: stageToUse });
      setDeals((prev) => [newDeal, ...prev]);
      if (newDeal.stage) {
        setStagePagination((prev) => {
          const cur = prev[newDeal.stage];
          if (!cur) return prev;
          return { ...prev, [newDeal.stage]: { ...cur, total: cur.total + 1 } };
        });
        setStageTotals((prev) => {
          const cur = prev[newDeal.stage];
          return {
            ...prev,
            [newDeal.stage]: {
              amount: (cur?.amount ?? 0) + newDeal.value,
              currency: cur?.currency ?? newDeal.currency ?? "RUB",
            },
          };
        });
      }
    } catch (err) {
      console.error("Failed to create deal:", err);
    }
    setModalOpen(false);
    setModalStage(null);
  }

  const activeStages: Stage[] = activePipeline.stages;

  return (
    <>
      <div className="flex w-full min-w-0 flex-col">
        <div className={viewMode === "kanban" ? "bg-white" : ""}>
          <DealsToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            filterAssignee={filterAssignee}
            onFilterAssignee={setFilterAssignee}
            filterPriority={filterPriority}
            onFilterPriority={setFilterPriority}
            totalDeals={filteredDeals.length}
            assignees={assignees}
          />
        </div>

        {viewMode === "kanban" ? (
          <div className="sticky z-10" style={{ top: 0, height: "calc(100dvh - 48px)" }}>
            <KanbanBoard
              stages={activeStages}
              deals={filteredDeals}
              stagePagination={stagePagination}
              serverStageTotals={stageTotals}
              onLoadMore={handleLoadMore}
              onMoveDeal={handleMoveDeal}
              onStageCommit={handleStageCommit}
              onAddDeal={handleAddDeal}
              onStageUpdate={handleStageUpdate}
              onStageDelete={handleStageDelete}
              onStageReorder={handleStageReorder}
              onAddStageAfter={handleAddStageAfter}
              onContactClick={setContactDeal}
              onDealClick={handleDealClick}
            />
          </div>
        ) : (
          <div className="flex min-w-0 flex-col">
            <DealsListView
              deals={filteredDeals}
              stages={activeStages}
              onDealClick={handleDealClick}
            />
          </div>
        )}
      </div>

      <CreateDealModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setModalStage(null);
        }}
        pipeline={activePipeline}
        initialStage={modalStage ?? activeStages[0]?.id ?? ""}
        onSave={handleCreateDeal}
      />

      <ContactDrawer deal={contactDeal} onClose={() => setContactDeal(null)} />

      <DealRightDrawer
        pipelines={pipelines}
        deal={selectedDeal}
        stages={activeStages}
        customFields={customFields}
        onClose={handleDrawerClose}
        onDealUpdate={(updated) =>
          setDeals((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
        }
      />
    </>
  );
}
