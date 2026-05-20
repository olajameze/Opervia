import { BRAND } from "@/lib/branding";

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
      <div className="mb-8 flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
          O
        </span>
        <span className="text-2xl font-bold">{BRAND.name}</span>
      </div>
      {children}
    </div>
  );
}
