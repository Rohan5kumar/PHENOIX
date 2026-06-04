"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ModelHealthStatus } from "@phoenix/shared-types";

const DEFAULT_WS_URL =
  process.env.NEXT_PUBLIC_API_WS_URL ?? "ws://localhost:8000/ws/health";

export type ConnectionStatus = "connecting" | "open" | "closed" | "error";

export function useHealthWebSocket(wsUrl: string = DEFAULT_WS_URL) {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [latest, setLatest] = useState<ModelHealthStatus | null>(null);
  const [history, setHistory] = useState<ModelHealthStatus[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus("connecting");
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setStatus("open");
    ws.onerror = () => setStatus("error");
    ws.onclose = () => {
      setStatus("closed");
      reconnectRef.current = setTimeout(connect, 3000);
    };
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as ModelHealthStatus;
        setLatest(payload);
        setHistory((prev) => [...prev.slice(-59), payload]);
      } catch {
        /* ignore malformed frames */
      }
    };
  }, [wsUrl]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { status, latest, history };
}
