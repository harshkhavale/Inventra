import { cn } from "@/lib/cn";

const control =
  "min-h-[38px] w-full rounded-[9px] border border-field bg-white px-3 text-sm text-ink outline-none transition-shadow focus:border-brand focus:ring-3 focus:ring-brand/15";

export function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[12.5px] font-semibold text-[#3b4556]">{label}</span>
      {children}
    </label>
  );
}

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(control, className)} {...props} />;
}

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return <select className={cn(control, "pr-8", className)} {...props} />;
}

export function FormError({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <div role="alert" className="rounded-[10px] bg-bad-bg px-3.5 py-2.5 text-[13.5px] text-bad">
      {children}
    </div>
  );
}
