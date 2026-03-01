"use client";

import type { HistoryViewState } from "@/lib/desktop/types";
import { RouteAppFrame } from "@/components/apps/route-app-frame";

interface HistoryAppViewProps {
  viewState: HistoryViewState;
  onInteract?: () => void;
}

export function HistoryAppView({ viewState, onInteract }: HistoryAppViewProps) {
  const params = new URLSearchParams();
  if (viewState.type) params.set("type", viewState.type);
  if (viewState.status) params.set("status", viewState.status);
  if (viewState.name) params.set("name", viewState.name);

  const query = params.toString();
  const path = query ? `/history?${query}` : "/history";

  return <RouteAppFrame path={path} title="History" onInteract={onInteract} />;
}
