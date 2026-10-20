import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "Sign up" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const { role } = await searchParams;
  return (
    <AuthShell>
      <AuthForm mode="signup" initialRole={role === "doctor" ? "doctor" : "patient"} />
    </AuthShell>
  );
}
