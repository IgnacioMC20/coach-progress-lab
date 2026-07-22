"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { makeQueryClient } from "@/lib/query-client";
import { ToastProvider } from "@/components/ui/toast";
export function Providers({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [queryClient] = useState(makeQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}
