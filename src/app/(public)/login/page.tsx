import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { role } = await searchParams;
  return (
    <AuthShell>
      <AuthForm mode="login" initialRole={role === "doctor" || role === "pharmacist" ? role : "patient"} />
    </AuthShell>
  );
}
