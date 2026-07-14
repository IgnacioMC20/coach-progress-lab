import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TermTooltip } from "@/components/shared/term-tooltip";

const initialInnerWidth = window.innerWidth;

describe("TermTooltip", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: initialInnerWidth,
    });
  });

  it("reveals an accessible definition when activated", () => {
    render(<TermTooltip term="e1RM" />);

    const trigger = screen.getByRole("button", { name: "Definición de e1RM" });
    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "máximo para una repetición",
    );
  });

  it("positions the portaled tooltip within the mobile viewport", async () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 320,
    });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      bottom: 120,
      height: 16,
      left: 300,
      right: 316,
      top: 104,
      width: 16,
      x: 300,
      y: 104,
      toJSON: () => ({}),
    });
    render(<TermTooltip term="RIR" />);

    fireEvent.click(screen.getByRole("button", { name: "Definición de RIR" }));

    await waitFor(() => {
      const tooltip = screen.getByText(
        "Repeticiones en reserva: cuántas repeticiones más podrías realizar antes del fallo.",
      );
      expect(tooltip).toHaveClass("fixed");
      expect(tooltip).toHaveStyle({ left: "196px", maxWidth: "224px" });
    });
  });
});
