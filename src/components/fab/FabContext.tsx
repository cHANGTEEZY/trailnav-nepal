import { createContext, useContext } from "react";

import type { FabPosition } from "./types";

export type FabContextValue = {
  open: boolean;
  position: FabPosition;
  itemCount: number;
  closeMenu: () => void;
};

export const FabContext = createContext<FabContextValue | null>(null);

export function useFabContext(): FabContextValue {
  const context = useContext(FabContext);
  if (!context) {
    throw new Error("Fab.Item must be rendered inside a <Fab> with children.");
  }
  return context;
}
