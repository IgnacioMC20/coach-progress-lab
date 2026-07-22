import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProgressDashboard } from "@/features/dashboard/components/progress-dashboard";

const getDashboard = vi.hoisted(() => vi.fn());

vi.mock("@/features/dashboard/services/dashboard-api", () => ({
  getDashboard,
}));

describe("ProgressDashboard", () => {
  it("renders the progress portfolio returned by the dashboard endpoint", async () => {
    getDashboard.mockResolvedValue({
      periodStart: "2026-07-06T12:00:00.000Z",
      summary: {
        activeClients: 2,
        completedWorkouts: 3,
        volumeKg: 1500,
        attentionClients: 1,
      },
      attention: [
        {
          clientId: "client-1",
          clientName: "Ligia Morales",
          primaryGoal: "Hipertrofia",
          lastWorkoutAt: "2026-07-11T16:30:00.000Z",
          lastCheckInAt: "2026-07-12T12:00:00.000Z",
          reasons: [
            { type: "PAIN", message: "Dolor 6/10 reportado recientemente." },
          ],
        },
      ],
      topProgress: [
        {
          clientId: "client-1",
          clientName: "Ligia Morales",
          averageE1RmChangePercentage: 8.4,
          personalRecords: 2,
        },
      ],
      recentActivity: [],
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ProgressDashboard />
      </QueryClientProvider>,
    );

    expect(
      await screen.findByRole("heading", { name: "Panorama de progreso" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Ligia Morales")).toHaveLength(2);
    expect(screen.getByText("+8.4%")).toBeInTheDocument();
    expect(
      screen.getByText("No hay actividad registrada durante este periodo."),
    ).toBeInTheDocument();
  });

  it("shows a guided empty state when there are no active clients", async () => {
    getDashboard.mockResolvedValue({
      periodStart: "2026-07-06T12:00:00.000Z",
      summary: {
        activeClients: 0,
        completedWorkouts: 0,
        volumeKg: 0,
        attentionClients: 0,
      },
      attention: [],
      topProgress: [],
      recentActivity: [],
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ProgressDashboard />
      </QueryClientProvider>,
    );

    expect(
      await screen.findByText("Aún no hay clientes activos"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Crear cliente" })).toHaveAttribute(
      "href",
      "/clients/new",
    );
  });
});
