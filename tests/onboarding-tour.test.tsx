import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Config, Driver } from "driver.js";
import {
  createTourSteps,
  OnboardingTour,
} from "@/features/onboarding/components/onboarding-tour";

const navigation = vi.hoisted(() => ({
  pathname: "/dashboard",
  push: vi.fn(),
}));
const api = vi.hoisted(() => ({
  getStatus: vi.fn(),
  markSeen: vi.fn(),
}));
const driverFactory = vi.hoisted(() => vi.fn());
const clients = vi.hoisted(() => ({ list: vi.fn() }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ push: navigation.push }),
}));
vi.mock("@/features/onboarding/services/onboarding-api", () => ({
  onboardingApi: api,
}));
vi.mock("@/features/clients/services/client-api", () => ({
  clientApi: clients,
}));
vi.mock("driver.js", () => ({ driver: driverFactory }));

type FakeDriver = Driver & { activeIndex: number };

function fakeDriver(): FakeDriver {
  const value = {
    activeIndex: 0,
    destroy: vi.fn(),
    drive: vi.fn((index = 0) => {
      value.activeIndex = index;
    }),
    moveTo: vi.fn((index: number) => {
      value.activeIndex = index;
    }),
  };
  return value as unknown as FakeDriver;
}

describe("OnboardingTour", () => {
  const configs: Config[] = [];
  const drivers: FakeDriver[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    configs.length = 0;
    drivers.length = 0;
    navigation.pathname = "/dashboard";
    window.history.replaceState({}, "", "/dashboard");
    api.getStatus.mockResolvedValue({
      currentVersion: 2,
      seen: false,
      seenAt: null,
    });
    api.markSeen.mockResolvedValue({
      currentVersion: 2,
      seen: true,
      seenAt: "2026-07-14T18:00:00.000Z",
    });
    driverFactory.mockImplementation((config: Config) => {
      const current = fakeDriver();
      configs.push(config);
      drivers.push(current);
      return current;
    });
    clients.list.mockResolvedValue({ items: [] });
  });

  afterEach(() => cleanup());

  it("starts automatically only when the current version is unseen", async () => {
    render(<OnboardingTour />);

    await waitFor(() => expect(driverFactory).toHaveBeenCalledTimes(1));
    expect(drivers[0].drive).toHaveBeenCalledWith(0);
    expect(
      screen.getByRole("button", { name: "Iniciar recorrido guiado" }),
    ).toBeInTheDocument();

    cleanup();
    vi.clearAllMocks();
    api.getStatus.mockResolvedValue({
      currentVersion: 2,
      seen: true,
      seenAt: "2026-07-14T18:00:00.000Z",
    });
    render(<OnboardingTour />);

    await waitFor(() => expect(api.getStatus).toHaveBeenCalledTimes(1));
    expect(driverFactory).not.toHaveBeenCalled();
  });

  it("lets a seen user replay the tour from the global help button", async () => {
    api.getStatus.mockResolvedValue({
      currentVersion: 2,
      seen: true,
      seenAt: "2026-07-14T18:00:00.000Z",
    });
    render(<OnboardingTour />);

    fireEvent.click(
      screen.getByRole("button", { name: "Iniciar recorrido guiado" }),
    );

    await waitFor(() => expect(driverFactory).toHaveBeenCalledTimes(1));
    expect(drivers[0].drive).toHaveBeenCalledWith(0);
  });

  it("navigates across routes, resumes the index and supports going back", async () => {
    const view = render(
      <>
        <div data-tour="clients-overview" />
        <OnboardingTour />
      </>,
    );
    await waitFor(() => expect(driverFactory).toHaveBeenCalledTimes(1));

    configs[0].onNextClick?.(undefined, {}, {
      driver: drivers[0],
      index: 0,
    } as never);
    expect(drivers[0].moveTo).toHaveBeenCalledWith(1);

    configs[0].onNextClick?.(undefined, {}, {
      driver: drivers[0],
      index: 1,
    } as never);
    expect(navigation.push).toHaveBeenCalledWith("/clients");
    expect(api.markSeen).not.toHaveBeenCalled();

    navigation.pathname = "/clients";
    window.history.replaceState({}, "", "/clients");
    view.rerender(
      <>
        <div data-tour="clients-overview" />
        <OnboardingTour />
      </>,
    );
    await waitFor(() => expect(driverFactory).toHaveBeenCalledTimes(2));
    expect(drivers[1].drive).toHaveBeenCalledWith(2);

    configs[1].onPrevClick?.(undefined, {}, {
      driver: drivers[1],
      index: 2,
    } as never);
    expect(navigation.push).toHaveBeenLastCalledWith("/dashboard");
  });

  it("marks the tour as seen when it is closed", async () => {
    render(<OnboardingTour />);
    await waitFor(() => expect(driverFactory).toHaveBeenCalledTimes(1));

    configs[0].onDestroyStarted?.(undefined, {}, {
      driver: drivers[0],
      index: 0,
    } as never);

    expect(api.markSeen).toHaveBeenCalledTimes(1);
    expect(drivers[0].destroy).toHaveBeenCalledTimes(1);
  });

  it("does not force the tour when the status request fails", async () => {
    api.getStatus.mockRejectedValue(new Error("offline"));
    render(<OnboardingTour />);

    await waitFor(() => expect(api.getStatus).toHaveBeenCalledTimes(1));
    expect(driverFactory).not.toHaveBeenCalled();
  });

  it("adds the client programming step only when an active client is available", () => {
    const withoutClient = createTourSteps();
    const withClient = createTourSteps("6a557679db9cc80c27e65c54");

    expect(withoutClient).toHaveLength(13);
    expect(withClient).toHaveLength(14);
    expect(withoutClient.some((step) => step.route.includes("6a557"))).toBe(
      false,
    );
    expect(withClient).toContainEqual(
      expect.objectContaining({
        route: "/clients/6a557679db9cc80c27e65c54",
        element: '[data-tour="client-programming"]',
      }),
    );
  });

  it("builds the extended tour with the first active client", async () => {
    clients.list.mockResolvedValue({
      items: [{ id: "6a557679db9cc80c27e65c54" }],
    });
    render(<OnboardingTour />);

    await waitFor(() => expect(driverFactory).toHaveBeenCalledTimes(1));
    expect(clients.list).toHaveBeenCalledTimes(1);
    expect(configs[0]?.steps).toHaveLength(14);
  });
});
