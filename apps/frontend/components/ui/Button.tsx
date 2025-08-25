import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-brand-blue text-white hover:brightness-[1.06] hover:-translate-y-px active:translate-y-0 active:brightness-95",
  secondary:
    "bg-white text-ink border border-line hover:bg-surface-muted hover:border-line-strong",
  ghost: "bg-transparent text-ink hover:bg-surface-muted",
  destructive:
    "bg-transparent text-brand-red border border-brand-red hover:bg-brand-red-50",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-8 px-3 text-body-sm gap-1.5",
  md: "h-10 px-5 text-body-sm gap-2",
  lg: "h-12 px-6 text-body gap-2",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", className = "", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center rounded font-medium transition-[transform,filter,background-color,border-color,box-shadow] duration-120 ease-out-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:opacity-40 disabled:pointer-events-none ${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
});
