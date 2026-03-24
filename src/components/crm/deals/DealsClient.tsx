"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import DealsToolbar, { type ViewMode } from "./DealsToolbar";
import KanbanBoard from "./KanbanBoard";
import DealsListView from "./DealsListView";
import CreateDealModal from "./CreateDealModal";
import ContactDrawer from "./ContactDrawer";
import DealDrawer from "./DealDrawer";
import { useCrmHeaderAction } from "@/components/crm/CrmHeaderActionContext";
import { useCrmDealPipeline } from "@/components/crm/CrmDealPipelineContext";
import { pipelines, mockDeals, type Deal } from "./mockData";

const STAGE_OVERRIDES_KEY = "crm-kanban-stage-overrides";

type StageOverrides = Record<string, Record<string, { label?: string; color?: string }>>;

export default function DealsClient() {
  const { setHeaderAction } = useCrmHeaderAction();
  const { setPipeline } = useCrmDealPipeline();
  const [deals, setDeals] = useState<Deal[]>(mockDeals);
  const [activePipelineId, setActivePipelineId] = useState("main");
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<Deal["priority"] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStage, setModalStage] = useState<string | null>(null);
  const [stageOverrides, setStageOverrides] = useState<StageOverrides>({});
  const [contactDeal, setContactDeal] = useState<Deal | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  const openCreateDeal = useCallback(() => {
    setModalStage(null);
    setModalOpen(true);
  }, []);

  useEffect(() => {
    setHeaderAction({
      label: "Добавить сделку",
      onClick: openCreateDeal,
    });
    return () => setHeaderAction(null);
  }, [setHeaderAction, openCreateDeal]);

  useEffect(() => {
    setPipeline({
      pipelines,
      activePipelineId,
      onPipelineChange: setActivePipelineId,
    });
    return () => setPipeline(null);
  }, [setPipeline, activePipelineId]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STAGE_OVERRIDES_KEY);
      if (raw) setStageOverrides(JSON.parse(raw) as StageOverrides);
    } catch {
      // ignore
    }
  }, []);

  const activePipelineWithOverrides = useMemo(() => {
    const p = pipelines.find((x) => x.id === activePipelineId) ?? pipelines[0];
    const ov = stageOverrides[p.id] ?? {};
    return {
      ...p,
      stages: p.stages.map((s) => ({
        ...s,
        label: ov[s.id]?.label ?? s.label,
        color: ov[s.id]?.color ?? s.color,
      })),
    };
  }, [activePipelineId, stageOverrides]);

  const filteredDeals = useMemo(() => {
    let result = deals;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.company.toLowerCase().includes(q) ||
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

  const handleStageUpdate = useCallback(
    (stageId: string, updates: { label?: string; color?: string }) => {
      setStageOverrides((prev) => {
        const pid = activePipelineId;
        const next: StageOverrides = {
          ...prev,
          [pid]: {
            ...prev[pid],
            [stageId]: { ...prev[pid]?.[stageId], ...updates },
          },
        };
        try {
          localStorage.setItem(STAGE_OVERRIDES_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [activePipelineId]
  );

  function handleMoveDeal(dealId: string, newStage: string) {
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d))
    );
  }

  function handleAddDeal(stageId: string) {
    setModalStage(stageId);
    setModalOpen(true);
  }

  function handleCreateDeal(deal: Deal) {
    if (modalStage) {
      deal.stage = modalStage;
    }
    setDeals((prev) => [deal, ...prev]);
    setModalOpen(false);
    setModalStage(null);
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
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
        />

        {viewMode === "kanban" ? (
          <KanbanBoard
            stages={activePipelineWithOverrides.stages}
            deals={filteredDeals}
            onMoveDeal={handleMoveDeal}
            onAddDeal={handleAddDeal}
            onStageUpdate={handleStageUpdate}
            onContactClick={setContactDeal}
            onDealClick={setSelectedDeal}
          />
        ) : (
          <DealsListView
            deals={filteredDeals}
            stages={activePipelineWithOverrides.stages}
            onDealClick={setSelectedDeal}
          />
        )}
      </div>

      <CreateDealModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setModalStage(null);
        }}
        pipeline={activePipelineWithOverrides}
        onSave={handleCreateDeal}
      />

      <ContactDrawer deal={contactDeal} onClose={() => setContactDeal(null)} />

      <DealDrawer
        deal={selectedDeal}
        stages={activePipelineWithOverrides.stages}
        onClose={() => setSelectedDeal(null)}
      />
    </>
  );
}
