"use client";

import { useState, useTransition, useCallback, useRef, useEffect } from "react";
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Pencil,
  Check,
  X,
  Trophy,
  Ban,
  AlertCircle,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import type { SettingsPipeline, SettingsStage } from "@/app/actions/pipeline-settings";
import {
  createPipeline,
  renamePipeline,
  deletePipeline,
  addStageToP,
  updateStageSettings,
  deleteStageSettings,
  reorderPipelineStages,
} from "@/app/actions/pipeline-settings";

/* ─── Sortable Stage Row ──────────────────────────────────────────────────── */

function SortableStageRow({
  stage,
  onUpdate,
  onDelete,
}: {
  stage: SettingsStage;
  onUpdate: (id: string, u: Parameters<typeof updateStageSettings>[1]) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(stage.name);
  const [color, setColor] = useState(stage.color ?? "#6B7280");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const isSystem = stage.semantics === "WON" || stage.semantics === "LOSE";

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  function save() {
    const trimmed = name.trim();
    if (trimmed && (trimmed !== stage.name || color !== stage.color)) {
      onUpdate(stage.id, { name: trimmed, color });
    }
    setEditing(false);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-white px-3 py-2.5 group",
        isDragging ? "border-brand-300 shadow-lg" : "border-gray-100",
        isSystem && "bg-gray-50/50"
      )}
    >
      {!isSystem && (
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors"
          {...listeners}
          {...attributes}
        >
          <GripVertical size={14} />
        </button>
      )}
      {isSystem && <div className="w-[14px]" />}

      <div
        className="w-3.5 h-3.5 rounded-full shrink-0 border border-white shadow-sm"
        style={{ backgroundColor: color }}
      />

      {editing ? (
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") { setName(stage.name); setEditing(false); } }}
            className="flex-1 min-w-0 text-sm px-2 py-1 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-7 h-7 rounded cursor-pointer border-0 p-0"
          />
          <button type="button" onClick={save} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={14} /></button>
          <button type="button" onClick={() => { setName(stage.name); setColor(stage.color ?? "#6B7280"); setEditing(false); }} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X size={14} /></button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm text-gray-800 truncate">{stage.name}</span>
          {stage.semantics === "WON" && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-green-700 bg-green-100 rounded-full px-2 py-0.5">
              <Trophy size={10} /> Won
            </span>
          )}
          {stage.semantics === "LOSE" && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-red-700 bg-red-100 rounded-full px-2 py-0.5">
              <Ban size={10} /> Lose
            </span>
          )}
          {stage._count.deals > 0 && (
            <span className="text-[10px] text-gray-400 tabular-nums">{stage._count.deals} сд.</span>
          )}
        </div>
      )}

      {!editing && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button type="button" onClick={() => setEditing(true)} className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"><Pencil size={13} /></button>
          {!isSystem && stage._count.deals === 0 && (
            <button type="button" onClick={() => onDelete(stage.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={13} /></button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Pipeline Card ───────────────────────────────────────────────────────── */

function PipelineCard({
  pipeline,
  onRefresh,
}: {
  pipeline: SettingsPipeline;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [renaming, setRenaming] = useState(false);
  const [pName, setPName] = useState(pipeline.name);
  const [stages, setStages] = useState(pipeline.stages);
  const [addingStage, setAddingStage] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [newStageColor, setNewStageColor] = useState("#6B7280");
  const [confirmDeletePipeline, setConfirmDeletePipeline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const renameRef = useRef<HTMLInputElement>(null);
  const addRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setStages(pipeline.stages); }, [pipeline.stages]);
  useEffect(() => { if (renaming) renameRef.current?.focus(); }, [renaming]);
  useEffect(() => { if (addingStage) addRef.current?.focus(); }, [addingStage]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const workStages = stages.filter((s) => !s.isFinal);
  const wonStage = stages.find((s) => s.semantics === "WON");
  const loseStage = stages.find((s) => s.semantics === "LOSE");
  const totalDeals = stages.reduce((sum, s) => sum + s._count.deals, 0);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = workStages.findIndex((s) => s.id === active.id);
    const newIdx = workStages.findIndex((s) => s.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = arrayMove(workStages, oldIdx, newIdx);
    const full = [...reordered, ...(wonStage ? [wonStage] : []), ...(loseStage ? [loseStage] : [])];
    setStages(full);
    startTransition(() => {
      reorderPipelineStages(full.map((s) => s.id)).catch(() => setStages(pipeline.stages));
    });
  }

  function handleStageUpdate(stageId: string, updates: Parameters<typeof updateStageSettings>[1]) {
    setStages((prev) => prev.map((s) => s.id === stageId ? { ...s, ...updates } : s));
    startTransition(() => {
      updateStageSettings(stageId, updates).catch(() => setStages(pipeline.stages));
    });
  }

  function handleStageDelete(stageId: string) {
    setStages((prev) => prev.filter((s) => s.id !== stageId));
    startTransition(() => {
      deleteStageSettings(stageId).then(onRefresh).catch(() => setStages(pipeline.stages));
    });
  }

  function handleAddStage() {
    const n = newStageName.trim();
    if (!n) return;
    const insertAt = workStages.length;
    startTransition(async () => {
      try {
        await addStageToP(pipeline.id, n, newStageColor, insertAt);
        setNewStageName("");
        setNewStageColor("#6B7280");
        setAddingStage(false);
        onRefresh();
      } catch {
        setError("Не удалось добавить стадию");
      }
    });
  }

  function handleRenamePipeline() {
    const n = pName.trim();
    if (!n || n === pipeline.name) { setRenaming(false); return; }
    startTransition(() => {
      renamePipeline(pipeline.id, n).then(onRefresh).catch(() => setPName(pipeline.name));
    });
    setRenaming(false);
  }

  function handleDeletePipeline() {
    startTransition(async () => {
      try {
        await deletePipeline(pipeline.id);
        onRefresh();
      } catch {
        setError("Удалите сначала все сделки из воронки");
      }
    });
    setConfirmDeletePipeline(false);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Pipeline header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-gray-50/60">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {renaming ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              ref={renameRef}
              value={pName}
              onChange={(e) => setPName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleRenamePipeline(); if (e.key === "Escape") { setPName(pipeline.name); setRenaming(false); } }}
              className="text-sm font-medium px-2 py-1 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400 flex-1"
            />
            <button type="button" onClick={handleRenamePipeline} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={14} /></button>
            <button type="button" onClick={() => { setPName(pipeline.name); setRenaming(false); }} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X size={14} /></button>
          </div>
        ) : (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{pipeline.name}</h3>
            <span className="text-xs text-gray-400">{stages.length} стадий · {totalDeals} сделок</span>
          </div>
        )}

        {!renaming && (
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setRenaming(true)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Переименовать"><Pencil size={14} /></button>
            {totalDeals === 0 && !confirmDeletePipeline && (
              <button type="button" onClick={() => setConfirmDeletePipeline(true)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Удалить воронку"><Trash2 size={14} /></button>
            )}
          </div>
        )}
      </div>

      {confirmDeletePipeline && (
        <div className="flex items-center justify-between gap-3 px-5 py-3 bg-red-50 border-t border-red-100">
          <span className="text-sm text-red-700">Удалить воронку &laquo;{pipeline.name}&raquo;?</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setConfirmDeletePipeline(false)} className="px-3 py-1.5 text-sm text-gray-600 rounded-lg hover:bg-white transition-colors">Отмена</button>
            <button type="button" onClick={handleDeletePipeline} className="px-3 py-1.5 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">Удалить</button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 px-5 py-2.5 bg-red-50 border-t border-red-100 text-sm text-red-700">
          <AlertCircle size={14} /> {error}
          <button type="button" onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-100 rounded"><X size={12} /></button>
        </div>
      )}

      {expanded && (
        <div className="px-5 py-4 space-y-2">
          {/* Work stages (draggable) */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Рабочие стадии</p>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={workStages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-1.5">
                  {workStages.map((stage) => (
                    <SortableStageRow key={stage.id} stage={stage} onUpdate={handleStageUpdate} onDelete={handleStageDelete} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Add stage inline */}
            {addingStage ? (
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-brand-300 bg-brand-50/30 px-3 py-2.5">
                <input
                  ref={addRef}
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddStage(); if (e.key === "Escape") setAddingStage(false); }}
                  placeholder="Название стадии..."
                  className="flex-1 min-w-0 text-sm px-2 py-1 rounded border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
                <input
                  type="color"
                  value={newStageColor}
                  onChange={(e) => setNewStageColor(e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer border-0 p-0"
                />
                <button type="button" onClick={handleAddStage} disabled={isPending} className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"><Check size={14} /></button>
                <button type="button" onClick={() => setAddingStage(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X size={14} /></button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingStage(true)}
                className="flex items-center gap-2 w-full rounded-lg border border-dashed border-gray-200 px-3 py-2.5 text-sm text-gray-500 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50/30 transition-colors"
              >
                <Plus size={14} /> Добавить стадию
              </button>
            )}
          </div>

          {/* System stages: WON / LOSE */}
          {(wonStage || loseStage) && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Системные стадии</p>
              {wonStage && <SortableStageRow stage={wonStage} onUpdate={handleStageUpdate} onDelete={handleStageDelete} />}
              {loseStage && <SortableStageRow stage={loseStage} onUpdate={handleStageUpdate} onDelete={handleStageDelete} />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────────── */

export default function PipelineSettingsClient({
  initialPipelines,
}: {
  initialPipelines: SettingsPipeline[];
}) {
  const [pipelines, setPipelines] = useState(initialPipelines);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (creating) inputRef.current?.focus(); }, [creating]);

  const refresh = useCallback(() => {
    window.location.reload();
  }, []);

  function handleCreate() {
    const n = newName.trim();
    if (!n) return;
    startTransition(async () => {
      try {
        const created = await createPipeline(n);
        setPipelines((prev) => [...prev, created]);
        setNewName("");
        setCreating(false);
      } catch {
        // error
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">Воронки</h2>
        {!creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand-500 text-white hover:bg-brand-600 transition-colors"
          >
            <Plus size={15} /> Новая воронка
          </button>
        )}
      </div>

      {creating && (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-brand-300 bg-brand-50/30 p-4">
          <input
            ref={inputRef}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setCreating(false); }}
            placeholder="Название воронки..."
            className="flex-1 min-w-0 text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <button type="button" onClick={handleCreate} disabled={isPending || !newName.trim()} className="px-4 py-2 rounded-lg text-sm font-medium bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition-colors">Создать</button>
          <button type="button" onClick={() => setCreating(false)} className="px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors">Отмена</button>
        </div>
      )}

      {pipelines.length === 0 && !creating && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-100 mb-4">
            <AlertCircle size={24} className="text-gray-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Нет воронок</h3>
          <p className="text-sm text-gray-500">Создайте первую воронку для работы со сделками</p>
        </div>
      )}

      <div className="space-y-4">
        {pipelines.map((p) => (
          <PipelineCard key={p.id} pipeline={p} onRefresh={refresh} />
        ))}
      </div>
    </div>
  );
}
