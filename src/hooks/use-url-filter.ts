"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/**
 * A filter value that lives in the URL (?status=low), so filtered views can
 * be linked to from the dashboard, bookmarked and shared.
 *
 * Components using this must sit inside a <Suspense> boundary.
 */
export function useUrlFilter<K extends string>(param: string, allowed: readonly K[], fallback: K): [K, (v: K) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const raw = params.get(param);
  const value = allowed.includes(raw as K) ? (raw as K) : fallback;

  const setValue = useCallback(
    (next: K) => {
      const sp = new URLSearchParams(params.toString());
      if (next === fallback) sp.delete(param);
      else sp.set(param, next);
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [fallback, param, params, pathname, router],
  );

  return [value, setValue];
}

/** Case-insensitive "does any of these fields contain the query". */
export function matches(query: string, ...fields: string[]): boolean {
  const q = query.trim().toLowerCase();
  return !q || fields.join(" ").toLowerCase().includes(q);
}
