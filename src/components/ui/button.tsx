import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "default" | "primary" | "dark" | "ghost";
type Size = "md" | "sm";

const variants: Record<Variant, string> = {
  default: "border-field bg-white text-ink hover:bg-[#f2f4f7]",
  primary: "border-brand bg-brand text-white hover:bg-brand-hover hover:border-brand-hover",
  dark: "border-ink bg-ink text-white hover:bg-ink-hover",
  ghost: "border-transparent bg-transparent text-brand hover:bg-brand-soft",
};

const sizes: Record<Size, string> = {
  md: "min-h-9 px-3.5 text-[13px] rounded-[9px]",
  sm: "min-h-[30px] px-2.5 text-[12.5px] rounded-lg",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = "default", size = "md", className, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 whitespace-nowrap border font-semibold transition-colors disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}

export function IconButton({ className, type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { "aria-label": string }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-[9px] border border-[#e1e4ea] bg-white text-[#3b4556] transition-colors hover:bg-[#f2f4f7]",
        className,
      )}
      {...props}
    />
  );
}

/** Inline text button used for record names inside tables and lists. */
export function LinkButton({ className, type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cn("p-0 text-left font-semibold text-ink hover:text-brand hover:underline", className)}
      {...props}
    />
  );
}
