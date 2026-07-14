import { ProgressionDashboard } from "@/features/progression/components/progression-dashboard";
import { Suspense } from "react";

export default function ProgressionPage() {
  return (
    <Suspense
      fallback={
        <div className="h-120 animate-pulse rounded-2xl border bg-white" />
      }
    >
      <ProgressionDashboard />
    </Suspense>
  );
}
