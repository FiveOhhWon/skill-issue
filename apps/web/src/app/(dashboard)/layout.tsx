import { AppShell } from "@/components/layout/app-shell";
import { Suspense } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--os-paper)]" />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
