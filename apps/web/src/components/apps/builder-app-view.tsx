"use client";

import { RouteAppFrame } from "@/components/apps/route-app-frame";

interface BuilderAppViewProps {
  onInteract?: () => void;
}

export function BuilderAppView({ onInteract }: BuilderAppViewProps) {
  return <RouteAppFrame path="/builder" title="Builder" onInteract={onInteract} />;
}
