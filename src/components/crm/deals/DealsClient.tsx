"use client";

import { useState, useMemo, useEffect, useCallback, useTransition } from "react";
import DealsToolbar, { type ViewMode } from "./DealsToolbar";
import KanbanBoard from "./KanbanBoard";
import DealsListView from "./DealsListView";
import CreateDealModal from "./CreateDealModal";
import ContactDrawer from "./ContactDrawer";
import DealDrawer from "./DealDrawer";
import { useCrmHeaderAction } from "@/components/crm/CrmHeaderActionContext";
import { useCrmDealPipeline } from "@/components/crm/CrmDealPipelineContext";
import { pipelines, type Deal, type CreateDealInput } from "./types";
import { updateDealStage, createDeal } from "@/app/actions/deals";

const STAGE_OVERRIDES_KEY = "crm-kanban-stage-overrides";

type StageOverrides = Record<string, Record<string, { label?: string; color?: string }>>;

interface DealsClientProps {
  initialDeals: Deal[];
}

export default function DealsClient({ initialDeals }: DealsClientProps) {
  const { setHeaderAction } = useCrmHeaderAction();
  const { setPipeline } = useCrmDealPipeline();
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
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
  const [, startTransition] = useTransition();

  const openCreateDeal = useCallback(() => {
    setModalStage(null);
    setModalOpen(true);
  }, []);

  useEffect(() => {
    setHeaderAction({ label: "Добавить сделку", onClick: openCreateDeal });
    return () => setHeaderAction(null);
  }, [setHeaderAction, openCreateDeal]);

  useEffect(() => {
    setPipeline({ pipelines, activePipelineId, onPipelineChange: setActivePipelineId });
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

  // Derive unique assignee names from loaded deals for toolbar filter
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

  const handleStageUpdate = useCallback(
    (stageId: string, updates: { label?: string; color?: string }) => {
      setStageOverrides((prev) => {
        const pid = activePipelineId;
        const next: StageOverrides = {
          ...prev,
          [pid]: { ...prev[pid], [stageId]: { ...prev[pid]?.[stageId], ...updates } },
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

  /** Optimistic local-state move — called during drag-over for live preview. */
  function handleMoveDeal(dealId: string, newStage: string) {
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d))
    );
  }

  /**
   * Called once on drag-end when the stage actually changed.
   * Persists to the DB and reverts the optimistic update on failure.
   */
  function handleStageCommit(dealId: string, newStage: string, previousStage: string) {
    if (newStage === previousStage) return;
    startTransition(() => {
      updateDealStage(dealId, newStage).catch(() => {
        setDeals((prev) =>
          prev.map((d) => (d.id === dealId ? { ...d, stage: previousStage } : d))
        );
      });
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
    } catch (err) {
      console.error("Failed to create deal:", err);
    }
    setModalOpen(false);
    setModalStage(null);
  }

  return (
    <>
      <div className="flex w-full min-w-0 flex-col">
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

        {viewMode === "kanban" ? (
          <KanbanBoard
            stages={activePipelineWithOverrides.stages}
            deals={filteredDeals}
            onMoveDeal={handleMoveDeal}
            onStageCommit={handleStageCommit}
            onAddDeal={handleAddDeal}
            onStageUpdate={handleStageUpdate}
            onContactClick={setContactDeal}
            onDealClick={setSelectedDeal}
          />
        ) : (
          <div className="flex min-w-0 flex-col">
            <DealsListView
              deals={filteredDeals}
              stages={activePipelineWithOverrides.stages}
              onDealClick={setSelectedDeal}
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
        pipeline={activePipelineWithOverrides}
        initialStage={modalStage ?? activePipelineWithOverrides.stages[0]?.id ?? "LEAD"}
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
