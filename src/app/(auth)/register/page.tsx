import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User, Building2 } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-1 text-center">
        <h1 className="text-3xl font-semibold text-foreground">
          Create your account
        </h1>
        <p className="text-muted-foreground text-sm">
          Choose your account type to get started
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <Button
          variant="outline"
          size="lg"
          className=" flex gap-2 border-border hover:bg-accent hover:text-foreground"
          asChild
        >
          <Link href="/register/individual">
            <User className="h-6 w-6 text-muted-foreground" />
            <p className="font-semibold text-foreground">Individual Account</p>
          </Link>
        </Button>

        <Button
          variant="outline"
          size="lg"
          className=" flex gap-2 border-border hover:bg-accent hover:text-foreground"
          asChild
        >
          <Link href="/register/enterprise">
            <Building2 className="h-6 w-6 text-muted-foreground" />
            <p className="font-semibold text-foreground">Enterprise Account</p>
          </Link>
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="underline hover:text-foreground transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
