"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CrmHeaderPrimaryAction = {
  label: string;
  onClick: () => void;
  /** Second action shown on hover (e.g. «Добавить лид»). */
  secondary?: { label: string; onClick: () => void };
} | null;

type Ctx = {
  headerAction: CrmHeaderPrimaryAction;
  setHeaderAction: (a: CrmHeaderPrimaryAction) => void;
};

const CrmHeaderActionContext = createContext<Ctx | null>(null);

export function CrmHeaderActionProvider({ children }: { children: ReactNode }) {
  const [headerAction, setHeaderActionState] = useState<CrmHeaderPrimaryAction>(null);
  const setHeaderAction = useCallback((a: CrmHeaderPrimaryAction) => {
    setHeaderActionState(a);
  }, []);

  const value = useMemo(
    () => ({ headerAction, setHeaderAction }),
    [headerAction, setHeaderAction]
  );

  return (
    <CrmHeaderActionContext.Provider value={value}>
      {children}
    </CrmHeaderActionContext.Provider>
  );
}

export function useCrmHeaderAction() {
  const ctx = useContext(CrmHeaderActionContext);
  if (!ctx) {
    throw new Error("useCrmHeaderAction must be used within CrmHeaderActionProvider");
  }
  return ctx;
}
