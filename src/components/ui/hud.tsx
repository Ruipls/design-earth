import type { ButtonHTMLAttributes, HTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function HUDPanel({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-lg border border-hud-border bg-hud text-ivory shadow-[0_18px_60px_rgba(0,0,0,0.32)] backdrop-blur-xl',
        className,
      )}
      {...props}
    />
  );
}

export function HUDButton({
  active = false,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex min-h-10 items-center justify-center rounded-md border px-3 text-sm font-medium transition',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold',
        active
          ? 'border-gold/50 bg-gold/15 text-gold shadow-[0_0_24px_rgba(212,168,83,0.16)]'
          : 'border-hud-border bg-ink/35 text-ivory-muted hover:border-gold/40 hover:bg-gold/10 hover:text-ivory',
        'disabled:cursor-not-allowed disabled:opacity-45',
        className,
      )}
      {...props}
    />
  );
}

export function HUDKicker({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        'text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-gold/80',
        className,
      )}
      {...props}
    />
  );
}
