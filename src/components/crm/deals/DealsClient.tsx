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
import { updateDealStage, createDeal, deleteStage } from "@/app/actions/deals";

const STAGE_OVERRIDES_KEY = "crm-kanban-stage-overrides";
const DEFAULT_STAGE_COLOR = "#6B7280";

type StageOverrides = Record<string, Record<string, { label?: string; color?: string }>>;

interface DealsClientProps {
  initialDeals: Deal[];
  initialPipelines: DbPipeline[];
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

export default function DealsClient({ initialDeals, initialPipelines }: DealsClientProps) {
  const { setHeaderAction } = useCrmHeaderAction();
  const { setPipeline } = useCrmDealPipeline();

  const pipelines = useMemo(() => mapDbToUiPipelines(initialPipelines), [initialPipelines]);

  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [activePipelineId, setActivePipelineId] = useState(pipelines[0]?.id ?? "");
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
    if (pipelines.length > 0) {
      setPipeline({ pipelines, activePipelineId, onPipelineChange: setActivePipelineId });
    }
    return () => setPipeline(null);
  }, [setPipeline, pipelines, activePipelineId]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STAGE_OVERRIDES_KEY);
      if (raw) setStageOverrides(JSON.parse(raw) as StageOverrides);
    } catch {
      // ignore
    }
  }, []);

  const activePipelineWithOverrides = useMemo((): Pipeline => {
    const p = pipelines.find((x) => x.id === activePipelineId) ?? pipelines[0];
    if (!p) return { id: "", label: "", stages: [] };
    const ov = stageOverrides[p.id] ?? {};
    return {
      ...p,
      stages: p.stages.map((s) => ({
        ...s,
        label: ov[s.id]?.label ?? s.label,
        color: ov[s.id]?.color ?? s.color,
      })),
    };
  }, [pipelines, activePipelineId, stageOverrides]);

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

  function handleMoveDeal(dealId: string, newStage: string) {
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d))
    );
  }

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

  function handleStageDelete(stageId: string) {
    startTransition(async () => {
      try {
        await deleteStage(stageId);
        // Reload the page to get fresh pipelines from the server
        window.location.reload();
      } catch (err) {
        console.error("Failed to delete stage:", err);
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
    } catch (err) {
      console.error("Failed to create deal:", err);
    }
    setModalOpen(false);
    setModalStage(null);
  }

  const activeStages: Stage[] = activePipelineWithOverrides.stages;

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
            stages={activeStages}
            deals={filteredDeals}
            onMoveDeal={handleMoveDeal}
            onStageCommit={handleStageCommit}
            onAddDeal={handleAddDeal}
            onStageUpdate={handleStageUpdate}
            onStageDelete={handleStageDelete}
            onContactClick={setContactDeal}
            onDealClick={setSelectedDeal}
          />
        ) : (
          <div className="flex min-w-0 flex-col">
            <DealsListView
              deals={filteredDeals}
              stages={activeStages}
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
        initialStage={modalStage ?? activeStages[0]?.id ?? ""}
        onSave={handleCreateDeal}
      />

      <ContactDrawer deal={contactDeal} onClose={() => setContactDeal(null)} />

      <DealRightDrawer
        deal={selectedDeal}
        stages={activeStages}
        onClose={() => setSelectedDeal(null)}
      />
    </>
  );
}
