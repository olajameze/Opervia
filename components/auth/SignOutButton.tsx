import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";

type SignOutButtonProps = {
  redirectTo?: string;
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
};

export function SignOutButton({
  redirectTo = "/login",
  variant = "outline",
  size = "sm",
  className,
}: SignOutButtonProps) {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo });
      }}
    >
      <Button variant={variant} size={size} type="submit" className={className}>
        Sign out
      </Button>
    </form>
  );
}
