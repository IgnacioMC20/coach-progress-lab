"use client";

import Link from "next/link";
import {
  Activity,
  ClipboardCheck,
  Dumbbell,
  LayoutDashboard,
  Menu,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { OnboardingTour } from "@/features/onboarding/components/onboarding-tour";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clientes", icon: Users },
  { href: "/routines", label: "Rutinas", icon: Dumbbell },
  { href: "/circuits", label: "Circuitos", icon: Activity },
  { href: "/exercises", label: "Ejercicios", icon: Dumbbell },
  { href: "/workouts", label: "Entrenamientos", icon: Activity },
  { href: "/check-ins", label: "Check-ins", icon: ClipboardCheck },
  { href: "/progression", label: "Progresión", icon: TrendingUp },
];
function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      <span className="bg-primary grid size-9 place-items-center rounded-xl text-[10px] font-black tracking-tight text-white">
        CPL
      </span>
      <span className="text-sm leading-4 font-black tracking-tight text-slate-900">
        COACH
        <br />
        PROGRESS LAB
      </span>
    </Link>
  );
}
function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="space-y-1">
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          onClick={onNavigate}
          key={href}
          href={href}
          className="hover:text-primary flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-violet-50"
        >
          <Icon size={18} strokeWidth={1.8} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
export function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#fafafc] md:flex">
      <aside className="hidden w-58 shrink-0 border-r border-slate-200/80 bg-white p-5 md:flex md:flex-col">
        <Brand />
        <div className="mt-10">
          <Navigation />
        </div>
        <div className="mt-auto flex items-center gap-3 border-t border-slate-100 pt-5">
          <div className="bg-lavender text-primary grid size-9 place-items-center rounded-full text-xs font-bold">
            CS
          </div>
          <div>
            <p className="text-xs font-bold">Cielo Sagastume</p>
            <p className="text-[11px] text-slate-500">Entrenadora</p>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-slate-200/80 bg-white px-4 md:px-8">
          <Button
            variant="outline"
            size="sm"
            className="md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu size={18} />
          </Button>
          <div className="hidden text-sm font-medium text-slate-400 md:block">
            Coach Progress Lab / Administración
          </div>
          <div className="ml-auto flex items-center gap-4">
            <OnboardingTour />
            <div className="from-lavender to-pink text-primary grid size-8 place-items-center rounded-full bg-gradient-to-br text-xs font-bold">
              CS
            </div>
          </div>
        </header>
        {open && (
          <div className="fixed inset-0 z-50 bg-slate-950/30 md:hidden">
            <aside className="h-full w-72 bg-white p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <Brand />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar menú"
                >
                  <X size={18} />
                </Button>
              </div>
              <div className="mt-10">
                <Navigation onNavigate={() => setOpen(false)} />
              </div>
            </aside>
          </div>
        )}
        <main className="flex-1 p-4 sm:p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
