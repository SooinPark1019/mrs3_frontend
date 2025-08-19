"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Loader2 } from "lucide-react";

type Ctx = { isNavigating: boolean; setIsNavigating: (v: boolean) => void };
const NavCtx = createContext<Ctx | null>(null);

export const useRouteOverlay = () => {
  const ctx = useContext(NavCtx);
  if (!ctx) throw new Error("useRouteOverlay must be used within <RouteOverlayProvider>");
  return ctx;
};

export function RouteOverlayProvider({ children }: { children: ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false);

  return (
    <NavCtx.Provider value={{ isNavigating, setIsNavigating }}>
      {children}
      {isNavigating && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-white/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm text-gray-700">이동 중…</p>
          </div>
        </div>
      )}
    </NavCtx.Provider>
  );
}
