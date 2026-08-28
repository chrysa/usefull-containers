import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { readToken } from "@/domain/auth/store";
import { groupByFactory } from "@/domain/factories/groupByFactory";
import type { Factory } from "@/domain/factories/types";
import { useSnapshotsQuery } from "@/domain/snapshots/queries";

const CURRENT_SAVE_NAME_KEY = "sfm.currentSaveName";

function readCurrentSaveName(): string | null {
  try {
    return localStorage.getItem(CURRENT_SAVE_NAME_KEY);
  } catch {
    return null;
  }
}

function writeCurrentSaveName(name: string | null): void {
  try {
    if (name) {
      localStorage.setItem(CURRENT_SAVE_NAME_KEY, name);
    } else {
      localStorage.removeItem(CURRENT_SAVE_NAME_KEY);
    }
  } catch {
    // localStorage unavailable — silently no-op
  }
}

export interface FactoryContextValue {
  factories: Factory[];
  currentSaveName: string | null;
  setCurrentSaveName: (name: string | null) => void;
}

export const FactoryContext = createContext<FactoryContextValue | null>(null);

export function FactoryProvider({ children }: { readonly children: ReactNode }) {
  const { data } = useSnapshotsQuery({ enabled: Boolean(readToken()) });
  const factories = useMemo(() => groupByFactory(data ?? []), [data]);
  const [currentSaveName, setCurrentSaveName] = useState<string | null>(() =>
    readCurrentSaveName(),
  );

  useEffect(() => {
    writeCurrentSaveName(currentSaveName);
  }, [currentSaveName]);

  useEffect(() => {
    if (factories.length === 0) return;
    const isCurrentSaveKnown = factories.some(
      (factory) => factory.saveName === currentSaveName,
    );
    if (currentSaveName !== null && isCurrentSaveKnown) return;
    const first = factories[0];
    setCurrentSaveName(first ? first.saveName : null);
  }, [factories, currentSaveName]);

  const value = useMemo<FactoryContextValue>(
    () => ({ factories, currentSaveName, setCurrentSaveName }),
    [factories, currentSaveName],
  );

  return <FactoryContext.Provider value={value}>{children}</FactoryContext.Provider>;
}

export function useFactory(): FactoryContextValue {
  const ctx = useContext(FactoryContext);
  if (!ctx) throw new Error("useFactory must be used inside <FactoryProvider>");
  return ctx;
}
