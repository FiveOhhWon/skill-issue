"use client";

import type { PipelinesViewState } from "@/lib/desktop/types";
import { RouteAppFrame } from "@/components/apps/route-app-frame";

interface PipelinesAppViewProps {
  viewState: PipelinesViewState;
  onInteract?: () => void;
}

export function PipelinesAppView({ viewState, onInteract }: PipelinesAppViewProps) {
  if (viewState.view === "run" && viewState.pipeline) {
    return (
      <RouteAppFrame
        path={`/pipelines/${encodeURIComponent(viewState.pipeline)}/run`}
        title="Pipeline Run"
        onInteract={onInteract}
      />
    );
  }

  return <RouteAppFrame path="/pipelines" title="Pipelines" onInteract={onInteract} />;
}
