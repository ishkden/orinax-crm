"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  type KanbanStyles,
  defaultKanbanStyles,
  KANBAN_STYLES_KEY,
} from "@/lib/kanban-styles";

const KanbanStyleContext = createContext<KanbanStyles>(defaultKanbanStyles);

export function KanbanStyleProvider({ children }: { children: ReactNode }) {
  const [styles, setStyles] = useState<KanbanStyles>(defaultKanbanStyles);

  useEffect(() => {
    fetch(`/api/admin/settings?key=${KANBAN_STYLES_KEY}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data === "object" && data.board) {
          const merged = JSON.parse(
            JSON.stringify(defaultKanbanStyles)
          ) as KanbanStyles;
          for (const sKey of Object.keys(merged) as (keyof KanbanStyles)[]) {
            if (data[sKey] && typeof data[sKey] === "object") {
              Object.assign(merged[sKey], data[sKey]);
            }
          }
          setStyles(merged);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <KanbanStyleContext.Provider value={styles}>
      {children}
    </KanbanStyleContext.Provider>
  );
}

export function useKanbanStyles(): KanbanStyles {
  return useContext(KanbanStyleContext);
}
