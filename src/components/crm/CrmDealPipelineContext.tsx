"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Pipeline } from "@/components/crm/deals/types";

export type CrmPipelineState = {
  pipelines: Pipeline[];
  activePipelineId: string;
  onPipelineChange: (id: string) => void;
};

type Ctx = {
  pipeline: CrmPipelineState | null;
  setPipeline: (v: CrmPipelineState | null) => void;
};

const CrmDealPipelineContext = createContext<Ctx | null>(null);

export function CrmDealPipelineProvider({ children }: { children: ReactNode }) {
  const [pipeline, setPipeline] = useState<CrmPipelineState | null>(null);
  const value = useMemo(() => ({ pipeline, setPipeline }), [pipeline]);
  return (
    <CrmDealPipelineContext.Provider value={value}>
      {children}
    </CrmDealPipelineContext.Provider>
  );
}

export function useCrmDealPipeline() {
  const ctx = useContext(CrmDealPipelineContext);
  if (!ctx) {
    throw new Error("useCrmDealPipeline must be used within CrmDealPipelineProvider");
  }
  return ctx;
}
