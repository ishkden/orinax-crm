"use client";

import { useState, useTransition, useCallback, useRef, useEffect } from "react";
import {
  Plus,
  Trash2,
  GripVertical,
  Pencil,
  Check,
  X,
  CirclePlus,
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
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn, contrastTextOnHex } from "@/lib/utils";
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

/* ─── Stage Pill (sortable) ────────────────────────────────────────────────── */

function StagePill({
  stage,
  onEdit,
  isDraggable,
}: {
  stage: SettingsStage;
  onEdit: (s: SettingsStage) => void;
  isDraggable?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id, disabled: !isDraggable });

  const bg = stage.color ?? "#6B7280";
  const fg = contrastTextOnHex(bg);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      type="button"
      onClick={() => onEdit(stage)}
      className={cn(
        "relative inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all",
        "hover:shadow-md hover:scale-105 cursor-pointer select-none",
        "max-w-[120px]",
        isDragging && "shadow-xl"
      )}
      title={`${stage.name}${stage._count.deals > 0 ? ` (${stage._count.deals} сделок)` : ""}`}
      {...(isDraggable ? { ...listeners, ...attributes } : {})}
    >
      <span
        className="absolute inset-0 rounded-lg"
        style={{ backgroundColor: bg }}
      />
      <span className="relative truncate" style={{ color: fg }}>{stage.name}</span>
    </button>
  );
}

/* ─── Stage Edit Popover ────────────────────────────────────────────────────── */

function StageEditPopover({
  stage,
  anchorRect,
  onSave,
  onDelete,
  onClose,
  isPending,
}: {
  stage: SettingsStage;
  anchorRect: { top: number; left: number } | null;
  onSave: (id: string, u: { name?: string; color?: string }) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(stage.name);
  const [color, setColor] = useState(stage.color ?? "#6B7280");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const isSystem = stage.semantics === "WON" || stage.semantics === "LOSE";
  const canDelete = !isSystem && stage._count.deals === 0;

  function handleSave() {
    const n = name.trim();
    if (n && (n !== stage.name || color !== (stage.color ?? "#6B7280"))) {
      onSave(stage.id, { name: n, color });
    }
    onClose();
  }

  if (!anchorRect) return null;

  let top = anchorRect.top + 8;
  let left = anchorRect.left;
  if (typeof window !== "undefined") {
    if (left + 240 > window.innerWidth - 16) left = window.innerWidth - 256;
    if (left < 16) left = 16;
    if (top + 200 > window.innerHeight - 16) top = anchorRect.top - 200;
  }

  return (
    <div
      ref={ref}
      className="fixed z-[100] w-60 rounded-xl border border-gray-200 bg-white shadow-2xl p-3 space-y-3"
      style={{ top, left }}
    >
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Название</label>
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") onClose(); }}
          className="w-full text-sm px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Цвет</label>
        <div className="flex items-center gap-2">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
          <div className="flex-1 h-6 rounded-md" style={{ backgroundColor: color }} />
        </div>
      </div>
      <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
        <button type="button" onClick={handleSave} disabled={isPending} className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"><Check size={12} /> Сохранить</button>
        {canDelete && (
          <button type="button" onClick={() => { onDelete(stage.id); onClose(); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13} /></button>
        )}
      </div>
    </div>
  );
}

/* ─── Add Stage Popover ──────────────────────────────────────────────────── */

function AddStagePopover({
  anchorRect,
  onAdd,
  onClose,
  isPending,
}: {
  anchorRect: { top: number; left: number };
  onAdd: (name: string, color: string) => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6B7280");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  function handleAdd() {
    const n = name.trim();
    if (!n) return;
    onAdd(n, color);
  }

  let top = anchorRect.top + 8;
  let left = anchorRect.left;
  if (typeof window !== "undefined") {
    if (left + 240 > window.innerWidth - 16) left = window.innerWidth - 256;
    if (top + 180 > window.innerHeight - 16) top = anchorRect.top - 180;
  }

  return (
    <div
      ref={ref}
      className="fixed z-[100] w-60 rounded-xl border border-gray-200 bg-white shadow-2xl p-3 space-y-3"
      style={{ top, left }}
    >
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Новая стадия</label>
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") onClose(); }}
          placeholder="Название..."
          className="w-full text-sm px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Цвет</label>
        <div className="flex items-center gap-2">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
          <div className="flex-1 h-6 rounded-md" style={{ backgroundColor: color }} />
        </div>
      </div>
      <button type="button" onClick={handleAdd} disabled={isPending || !name.trim()} className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"><Plus size={12} /> Добавить</button>
    </div>
  );
}

/* ─── Pipeline Row ────────────────────────────────────────────────────────── */

function PipelineRow({
  pipeline,
  onRefresh,
}: {
  pipeline: SettingsPipeline;
  onRefresh: () => void;
}) {
  const [stages, setStages] = useState(pipeline.stages);
  const [renaming, setRenaming] = useState(false);
  const [pName, setPName] = useState(pipeline.name);
  const [editingStage, setEditingStage] = useState<SettingsStage | null>(null);
  const [editAnchor, setEditAnchor] = useState<{ top: number; left: number } | null>(null);
  const [addAnchor, setAddAnchor] = useState<{ top: number; left: number } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const renameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setStages(pipeline.stages); }, [pipeline.stages]);
  useEffect(() => { if (renaming) renameRef.current?.focus(); }, [renaming]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const workStages = stages.filter((s) => !s.isFinal);
  const wonStages = stages.filter((s) => s.semantics === "WON");
  const loseStages = stages.filter((s) => s.semantics === "LOSE");
  const totalDeals = stages.reduce((sum, s) => sum + s._count.deals, 0);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = workStages.findIndex((s) => s.id === active.id);
    const newIdx = workStages.findIndex((s) => s.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = arrayMove(workStages, oldIdx, newIdx);
    const full = [...reordered, ...wonStages, ...loseStages];
    setStages(full);
    startTransition(() => {
      reorderPipelineStages(full.map((s) => s.id)).catch(() => setStages(pipeline.stages));
    });
  }

  function handleEditStage(stage: SettingsStage) {
    const el = document.querySelector(`[data-stage-id="${stage.id}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      setEditAnchor({ top: rect.bottom, left: rect.left });
    }
    setEditingStage(stage);
  }

  function handleStageUpdate(stageId: string, updates: { name?: string; color?: string }) {
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

  function handleAddStageClick(e: React.MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setAddAnchor({ top: rect.bottom, left: rect.left });
  }

  function handleAddStage(name: string, color: string) {
    const insertAt = workStages.length;
    startTransition(async () => {
      try {
        await addStageToP(pipeline.id, name, color, insertAt);
        setAddAnchor(null);
        onRefresh();
      } catch {
        // error
      }
    });
  }

  function handleRename() {
    const n = pName.trim();
    if (!n || n === pipeline.name) { setRenaming(false); return; }
    startTransition(() => {
      renamePipeline(pipeline.id, n).then(onRefresh).catch(() => setPName(pipeline.name));
    });
    setRenaming(false);
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deletePipeline(pipeline.id);
        onRefresh();
      } catch {
        // can't delete
      }
    });
    setConfirmDelete(false);
  }

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <div className="flex items-start gap-0 py-5 px-5">
        {/* Left: pipeline name + actions */}
        <div className="w-48 shrink-0 pt-0.5">
          <div className="flex items-center gap-1.5 mb-1">
            <GripVertical size={13} className="text-gray-300 shrink-0" />
            {renaming ? (
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <input
                  ref={renameRef}
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") { setPName(pipeline.name); setRenaming(false); } }}
                  className="flex-1 min-w-0 text-sm font-semibold px-1.5 py-0.5 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
                <button type="button" onClick={handleRename} className="p-0.5 text-green-600 hover:bg-green-50 rounded"><Check size={12} /></button>
                <button type="button" onClick={() => { setPName(pipeline.name); setRenaming(false); }} className="p-0.5 text-gray-400 hover:bg-gray-100 rounded"><X size={12} /></button>
              </div>
            ) : (
              <span className="text-sm font-semibold text-gray-900 truncate">{pipeline.name}</span>
            )}
            {!renaming && (
              <div className="flex items-center gap-0.5 ml-1">
                <button type="button" onClick={() => setRenaming(true)} className="p-0.5 text-gray-300 hover:text-gray-600 rounded transition-colors" title="Переименовать"><Pencil size={11} /></button>
                {totalDeals === 0 && (
                  <button type="button" onClick={() => setConfirmDelete(true)} className="p-0.5 text-gray-300 hover:text-red-500 rounded transition-colors" title="Удалить"><X size={12} /></button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center: stages as pills */}
        <div className="flex-1 min-w-0">
          {/* Section labels */}
          <div className="flex items-center gap-0 mb-2 text-[9px] font-bold uppercase tracking-wider text-gray-400">
            <div className="flex-1">В работе</div>
            {wonStages.length > 0 && <div className="w-[130px] text-center text-green-600 shrink-0">&#10003; Успешные</div>}
            {loseStages.length > 0 && <div className="w-[160px] text-center text-red-500 shrink-0">&#10005; Неуспешные</div>}
          </div>

          <div className="flex items-center gap-0">
            {/* Work stages — draggable */}
            <div className="flex-1 min-w-0">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={workStages.map((s) => s.id)} strategy={horizontalListSortingStrategy}>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {workStages.map((s) => (
                      <div key={s.id} data-stage-id={s.id}>
                        <StagePill stage={s} onEdit={handleEditStage} isDraggable />
                      </div>
                    ))}
                    {/* Add stage button */}
                    <button
                      type="button"
                      onClick={handleAddStageClick}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg border-2 border-dashed border-gray-200 text-gray-400 hover:border-brand-400 hover:text-brand-500 hover:bg-brand-50/40 transition-all"
                      title="Добавить стадию"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            {/* Won stages */}
            {wonStages.length > 0 && (
              <div className="flex items-center gap-1.5 ml-3 pl-3 border-l-2 border-green-200 shrink-0">
                {wonStages.map((s) => (
                  <div key={s.id} data-stage-id={s.id}>
                    <StagePill stage={s} onEdit={handleEditStage} />
                  </div>
                ))}
              </div>
            )}

            {/* Lose stages */}
            {loseStages.length > 0 && (
              <div className="flex items-center gap-1.5 ml-3 pl-3 border-l-2 border-red-200 shrink-0">
                {loseStages.map((s) => (
                  <div key={s.id} data-stage-id={s.id}>
                    <StagePill stage={s} onEdit={handleEditStage} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="flex items-center justify-between gap-3 mx-5 mb-4 px-4 py-3 bg-red-50 rounded-xl border border-red-100">
          <span className="text-sm text-red-700">Удалить воронку &laquo;{pipeline.name}&raquo;?</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 text-xs text-gray-600 rounded-lg hover:bg-white transition-colors">Отмена</button>
            <button type="button" onClick={handleDelete} className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">Удалить</button>
          </div>
        </div>
      )}

      {/* Stage edit popover */}
      {editingStage && editAnchor && typeof document !== "undefined" && (
        <StageEditPopover
          stage={editingStage}
          anchorRect={editAnchor}
          onSave={handleStageUpdate}
          onDelete={handleStageDelete}
          onClose={() => { setEditingStage(null); setEditAnchor(null); }}
          isPending={isPending}
        />
      )}

      {/* Add stage popover */}
      {addAnchor && typeof document !== "undefined" && (
        <AddStagePopover
          anchorRect={addAnchor}
          onAdd={handleAddStage}
          onClose={() => setAddAnchor(null)}
          isPending={isPending}
        />
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
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Воронки и туннели продаж</h2>
          <p className="text-xs text-gray-500 mt-0.5">{pipelines.length} воронок</p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand-500 text-white hover:bg-brand-600 transition-colors shadow-sm"
        >
          <Plus size={15} /> Добавить воронку
        </button>
      </div>

      {/* Create new pipeline inline */}
      {creating && (
        <div className="flex items-center gap-3 mb-4 rounded-xl border border-dashed border-brand-300 bg-brand-50/30 px-5 py-3.5">
          <input
            ref={inputRef}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") { setNewName(""); setCreating(false); } }}
            placeholder="Название новой воронки..."
            className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <button type="button" onClick={handleCreate} disabled={isPending || !newName.trim()} className="px-4 py-2 rounded-lg text-sm font-medium bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition-colors">Создать</button>
          <button type="button" onClick={() => { setNewName(""); setCreating(false); }} className="px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors">Отмена</button>
        </div>
      )}

      {/* Pipeline list */}
      {pipelines.length === 0 && !creating && (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-100 mb-4">
            <CirclePlus size={24} className="text-gray-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Нет воронок</h3>
          <p className="text-sm text-gray-500 mb-4">Создайте первую воронку для работы со сделками</p>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand-500 text-white hover:bg-brand-600 transition-colors"
          >
            <Plus size={15} /> Добавить воронку
          </button>
        </div>
      )}

      {pipelines.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {pipelines.map((p) => (
            <PipelineRow key={p.id} pipeline={p} onRefresh={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}
