"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import {
  type KanbanStyles,
  defaultKanbanStyles,
} from "@/lib/kanban-styles";

const KanbanStyleContext = createContext<KanbanStyles>(defaultKanbanStyles);

export function KanbanStyleProvider({
  children,
  initialStyles,
}: {
  children: ReactNode;
  initialStyles?: KanbanStyles;
}) {
  return (
    <KanbanStyleContext.Provider value={initialStyles ?? defaultKanbanStyles}>
      {children}
    </KanbanStyleContext.Provider>
  );
}

export function useKanbanStyles(): KanbanStyles {
  return useContext(KanbanStyleContext);
}
