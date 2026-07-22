import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FormAlert, FormField } from "@/components/ui/form-field";
import { ToastProvider, useToast } from "@/components/ui/toast";

afterEach(cleanup);

function ToastHarness() {
  const toast = useToast();
  return (
    <>
      <button
        onClick={() => toast.success("Cliente guardado", "Ligia Morales")}
      >
        Éxito
      </button>
      <button
        onClick={() => toast.error("No pudimos guardar", "Inténtalo de nuevo.")}
      >
        Error
      </button>
    </>
  );
}

describe("form feedback", () => {
  it("associates labels, hints and inline errors with the control", () => {
    render(
      <FormField
        name="email"
        label="Correo electrónico"
        required
        hint="Usa un correo válido."
        error="El correo no es válido"
      >
        <input />
      </FormField>,
    );

    const input = screen.getByLabelText(/Correo electrónico/);
    expect(screen.getByText("Obligatorio")).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")).toContain(
      "field-email-hint",
    );
    expect(input.getAttribute("aria-describedby")).toContain(
      "field-email-error",
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "El correo no es válido",
    );
  });

  it("marks optional controls and renders a form-level alert", () => {
    render(
      <>
        <FormField name="notes" label="Notas">
          <input />
        </FormField>
        <FormAlert message="No pudimos guardar los cambios." />
      </>,
    );
    expect(screen.getByText("Opcional")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos guardar");
  });

  it("shows dismissible success and error notifications", () => {
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Éxito" }));
    expect(screen.getByRole("status")).toHaveTextContent("Cliente guardado");
    fireEvent.click(screen.getByRole("button", { name: "Error" }));
    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos guardar");
    fireEvent.click(
      screen.getAllByRole("button", { name: "Cerrar notificación" })[0]!,
    );
    expect(screen.queryByText("Cliente guardado")).not.toBeInTheDocument();
  });
});
