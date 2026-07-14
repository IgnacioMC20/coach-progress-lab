export function PlaceholderPage({ title }: { title: string }) {
  return (
    <section className="rounded-xl border bg-white p-8">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="mt-2 text-slate-600">
        Este módulo se preparará en una siguiente fase.
      </p>
    </section>
  );
}
