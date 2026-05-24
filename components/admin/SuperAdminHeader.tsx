import { SignOutButton } from "@/components/auth/SignOutButton";

type SuperAdminHeaderProps = {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
};

export function SuperAdminHeader({ eyebrow, title, children }: SuperAdminHeaderProps) {
  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{eyebrow}</p>
          <h1 className="text-lg font-bold">{title}</h1>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {children}
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
