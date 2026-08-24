import { create } from 'zustand';
import type { ScanResult } from '@hair-analysis/shared';

type ScannerState = {
  lastResult: ScanResult | null;
  setLastResult: (result: ScanResult) => void;
};

// Holds the just-computed scan result in memory for the brief hop between the
// capture screen and the result screen — POST /api/scanner already returns
// the full result, so there is no need to re-fetch it.
export const useScannerStore = create<ScannerState>((set) => ({
  lastResult: null,
  setLastResult: (result) => set({ lastResult: result }),
}));
