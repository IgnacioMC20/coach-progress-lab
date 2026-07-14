import { Inbox } from "lucide-react";
export function EmptyState({
  title = "No hay resultados",
  description = "Prueba ajustar los filtros para ver más clientes.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="border-purple/70 bg-lavender/30 rounded-xl border border-dashed p-10 text-center">
      <Inbox className="text-primary mx-auto mb-3" />
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
    </div>
  );
}
