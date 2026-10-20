"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Stethoscope, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SocialButtons } from "@/components/auth/social-buttons";
import { useAuth } from "@/components/auth/auth-provider";
import { AUTH_HOME, login, signup } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

type Role = "patient" | "doctor";

const ROLES: { value: Role; label: string; icon: typeof User }[] = [
  { value: "patient", label: "Patient", icon: User },
  { value: "doctor", label: "Doctor", icon: Stethoscope },
];

/** One form for patients and doctors. Role is picked on sign up and read from the account on log in. */
export function AuthForm({ mode, initialRole }: { mode: "login" | "signup"; initialRole: Role }) {
  const router = useRouter();
  const { user } = useAuth();
  const [role, setRole] = useState<Role>(initialRole);
  const [name, setName] = useState("");
  const [registrationNo, setRegistrationNo] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignup = mode === "signup";

  // Already signed in (or just signed in): go to the dashboard.
  useEffect(() => {
    if (user) router.replace(AUTH_HOME[user.role]);
  }, [user, router]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = isSignup ? signup({ name, identifier, password, role, registrationNo }) : login(identifier, password, "public");
    if (!result.ok) setError(result.error);
  }

  const other = isSignup ? "/login" : "/signup";

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="mb-1 text-3xl font-extrabold tracking-tight">{isSignup ? "Create your account" : "Welcome back"}</h1>
      <p className="mb-6 text-muted-foreground">
        {isSignup ? "Sign up as a patient or a doctor with your email or phone." : "Log in with your email or phone number."}
      </p>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {isSignup && (
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Account type">
            {ROLES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={role === value}
                onClick={() => setRole(value)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition",
                  role === value ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20" : "hover:bg-muted",
                )}
              >
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </div>
        )}

        {isSignup && (
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" autoComplete="name" className="h-10" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rahim Uddin" />
          </div>
        )}

        {isSignup && role === "doctor" && (
          <div className="space-y-1.5">
            <Label htmlFor="registrationNo">BMDC registration number</Label>
            <Input id="registrationNo" className="h-10" value={registrationNo} onChange={(e) => setRegistrationNo(e.target.value)} placeholder="e.g. BMDC-A-12345" />
            <p className="text-xs text-muted-foreground">An admin reviews this before you can issue prescriptions.</p>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="identifier">Email or phone number</Label>
          <Input id="identifier" autoComplete="username" className="h-10" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="you@example.com or 01XXXXXXXXX" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={show ? "text" : "password"}
              autoComplete={isSignup ? "new-password" : "current-password"}
              className="h-10 pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignup ? "At least 6 characters" : "Your password"}
            />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground" aria-label={show ? "Hide password" : "Show password"}>
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

        <Button type="submit" className="h-10 w-full">{isSignup ? "Sign up" : "Log in"}</Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or continue with <span className="h-px flex-1 bg-border" />
      </div>
      <SocialButtons />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isSignup ? "Already have an account?" : "New to MediReach?"}{" "}
        <Link href={other} className="font-medium text-primary hover:underline">{isSignup ? "Log in" : "Sign up"}</Link>
      </p>
    </div>
  );
}
