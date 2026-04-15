import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Forgot Password?</h1>
        <p className="text-muted-foreground">Enter your email and we&apos;ll send you a reset link</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="m@example.com" />
        </div>
        <Button className="w-full">Send Reset Link</Button>
      </div>
      <div className="text-center text-sm">
        <a href="/login" className="underline font-medium">
          Back to Login
        </a>
      </div>
    </div>
  );
}
