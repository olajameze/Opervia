import { AuthBrandLockup } from "@/components/brand/AuthBrandLockup";

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
      <AuthBrandLockup />
      {children}
    </div>
  );
}
