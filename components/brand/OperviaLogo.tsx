import { cn } from "@/lib/utils";

type OperviaLogoProps = {
  size?: number;
  className?: string;
  /** Teal mark on light backgrounds (marketing, auth). */
  variant?: "default" | "sidebar";
  showWordmark?: boolean;
};

function LogoMark({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <circle
        cx="16"
        cy="16"
        r="7.25"
        stroke="white"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeDasharray="38 10"
        transform="rotate(-35 16 16)"
      />
      <circle cx="16" cy="7.5" r="1.75" fill="white" opacity="0.95" />
      <circle cx="23.5" cy="19.5" r="1.75" fill="white" opacity="0.95" />
      <circle cx="8.5" cy="19.5" r="1.75" fill="white" opacity="0.95" />
      <path
        d="M16 9.25v2M21.2 18.1l-1.7-1M10.5 18.1l1.7-1"
        stroke="white"
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

export function OperviaLogo({
  size = 32,
  className,
  variant = "default",
  showWordmark = false,
}: OperviaLogoProps) {
  if (variant === "sidebar") {
    return (
      <span className={cn("inline-flex shrink-0 items-center", className)}>
        <LogoMark size={size} />
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      {showWordmark && <span className="font-semibold">Opervia</span>}
    </span>
  );
}
