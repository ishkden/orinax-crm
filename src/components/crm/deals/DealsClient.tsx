"use client";

import { useState, useMemo } from "react";
import DealsToolbar, { type ViewMode } from "./DealsToolbar";
import KanbanBoard from "./KanbanBoard";
import DealsListView from "./DealsListView";
import CreateDealModal from "./CreateDealModal";
import { pipelines, mockDeals, type Deal } from "./mockData";

export default function DealsClient() {
  const [deals, setDeals] = useState<Deal[]>(mockDeals);
  const [activePipelineId, setActivePipelineId] = useState("main");
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<Deal["priority"] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStage, setModalStage] = useState<string | null>(null);

  const activePipeline = pipelines.find((p) => p.id === activePipelineId) ?? pipelines[0];

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
      <DealsToolbar
        pipelines={pipelines}
        activePipelineId={activePipelineId}
        onPipelineChange={setActivePipelineId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onCreateDeal={() => {
          setModalStage(null);
          setModalOpen(true);
        }}
        filterAssignee={filterAssignee}
        onFilterAssignee={setFilterAssignee}
        filterPriority={filterPriority}
        onFilterPriority={setFilterPriority}
        totalDeals={filteredDeals.length}
      />

      {viewMode === "kanban" ? (
        <KanbanBoard
          stages={activePipeline.stages}
          deals={filteredDeals}
          onMoveDeal={handleMoveDeal}
          onAddDeal={handleAddDeal}
        />
      ) : (
        <DealsListView
          deals={filteredDeals}
          stages={activePipeline.stages}
        />
      )}

      <CreateDealModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setModalStage(null);
        }}
        pipeline={activePipeline}
        onSave={handleCreateDeal}
      />
    </>
  );
}
