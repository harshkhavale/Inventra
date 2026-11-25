export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="mb-1.5 text-xs font-semibold tracking-[0.08em] text-muted uppercase">{eyebrow}</p>
        <h1 className="text-[26px] leading-tight font-[650] tracking-[-0.02em]">{title}</h1>
        {description && <p className="mt-1.5 text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
    </header>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="mb-1.5 text-xs font-semibold tracking-[0.08em] text-muted uppercase">{children}</p>;
}
