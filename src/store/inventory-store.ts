"use client";

import { useSyncExternalStore } from "react";
import { createSeedState } from "@/lib/seed";
import type { InventoryState } from "@/lib/types";

/**
 * A tiny external store for the inventory data.
 *
 * - The server (and the first client render) always sees the seed data, so
 *   hydration never mismatches.
 * - After hydration React switches to the client snapshot, which is loaded
 *   from localStorage. Every change is written back, so the demo survives a
 *   refresh until the user resets it.
 */
const STORAGE_KEY = "inventra:state:v1";
const SEED = createSeedState();

let current: InventoryState | null = null;
const listeners = new Set<() => void>();

function load(): InventoryState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as InventoryState;
  } catch {
    // Corrupt or unavailable storage: fall back to the demo data.
  }
  return SEED;
}

function persist(state: InventoryState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode or quota: the app still works, it just won't remember.
  }
}

function getSnapshot(): InventoryState {
  current ??= load();
  return current;
}

const getServerSnapshot = () => SEED;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setState(next: InventoryState) {
  current = next;
  persist(next);
  listeners.forEach((l) => l());
}

export const inventoryStore = {
  getState: getSnapshot,
  setState,
  reset() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {}
    current = createSeedState();
    listeners.forEach((l) => l());
  },
};

export function useInventory(): InventoryState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
