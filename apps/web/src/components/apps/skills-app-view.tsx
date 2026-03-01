"use client";

import type { SkillsViewState } from "@/lib/desktop/types";
import { RouteAppFrame } from "@/components/apps/route-app-frame";

interface SkillsAppViewProps {
  viewState: SkillsViewState;
  onInteract?: () => void;
}

export function SkillsAppView({ viewState, onInteract }: SkillsAppViewProps) {
  if (viewState.view === "detail" && viewState.skill) {
    return (
      <RouteAppFrame
        path={`/skills/${encodeURIComponent(viewState.skill)}`}
        title="Skill Detail"
        onInteract={onInteract}
      />
    );
  }

  if (viewState.view === "edit" && viewState.skill) {
    return (
      <RouteAppFrame
        path={`/skills/${encodeURIComponent(viewState.skill)}/edit`}
        title="Skill Editor"
        onInteract={onInteract}
      />
    );
  }

  return <RouteAppFrame path="/skills" title="Skills" onInteract={onInteract} />;
}
