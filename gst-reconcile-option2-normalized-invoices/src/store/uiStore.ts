import { create } from 'zustand';

/* =========================================================================
 * Shared UI state — lets in-dashboard dock buttons open the global
 * Notification Center, History & Guidance coach and GSTN Gateway panels.
 * ======================================================================= */

interface UiState {
  notifyOpen: boolean;
  guideOpen: boolean;
  gatewayOpen: boolean;
  setNotify: (v: boolean) => void;
  toggleNotify: () => void;
  setGuide: (v: boolean) => void;
  toggleGuide: () => void;
  setGateway: (v: boolean) => void;
  toggleGateway: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  notifyOpen: false,
  guideOpen: false,
  gatewayOpen: false,
  setNotify: (v) => set({ notifyOpen: v }),
  toggleNotify: () => set((s) => ({ notifyOpen: !s.notifyOpen })),
  setGuide: (v) => set({ guideOpen: v }),
  toggleGuide: () => set((s) => ({ guideOpen: !s.guideOpen })),
  setGateway: (v) => set({ gatewayOpen: v }),
  toggleGateway: () => set((s) => ({ gatewayOpen: !s.gatewayOpen })),
}));
