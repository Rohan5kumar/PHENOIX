"use client";

import { useCallback, useEffect, useState } from "react";
import type { AlchemistAction } from "@phoenix/shared-types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_HTTP_URL ?? "http://localhost:8000";

export function useAlchemistActions(pollMs = 5000) {
  const [actions, setActions] = useState<AlchemistAction[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchActions = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/governance/alchemist-actions`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as AlchemistAction[];
      setActions(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "fetch failed");
    }
  }, []);

  useEffect(() => {
    fetchActions();
    const id = setInterval(fetchActions, pollMs);
    return () => clearInterval(id);
  }, [fetchActions, pollMs]);

  return { actions, error, refresh: fetchActions };
}
