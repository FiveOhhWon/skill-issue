"use client";

import { DashboardContent } from "@/components/apps/dashboard-content";

export function DashboardAppView() {
  return (
    <div className="h-full overflow-auto bg-[var(--os-panel)] p-4 text-[var(--os-ink)]">
      <DashboardContent />
    </div>
  );
}
