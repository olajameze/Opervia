import { BRAND } from "@/lib/branding";
import { OperviaLogo } from "@/components/brand/OperviaLogo";

export function AuthBrandLockup() {
  return (
    <div className="mb-8 flex items-center gap-2.5 text-opervia-brand">
      <OperviaLogo size={40} />
      <span className="text-2xl font-bold">{BRAND.name}</span>
    </div>
  );
}
