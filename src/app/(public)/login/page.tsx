import { Stethoscope, Store, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Photo } from "@/components/shared/photo";
import { loginAs } from "@/lib/actions/auth";
import { IMAGES } from "@/lib/images";
import { primaryUserFor } from "@/lib/services/user.service";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

export const metadata = { title: "Log in" };

const accounts: { role: Role; icon: typeof User; text: string }[] = [
  { role: "patient", icon: User, text: "Search, order, view prescriptions and orders" },
  { role: "doctor", icon: Stethoscope, text: "Issue digital prescriptions to patients" },
  { role: "pharmacist", icon: Store, text: "Manage inventory and fulfil orders" },
];

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { role: highlight } = await searchParams;
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div className="relative hidden aspect-[4/5] overflow-hidden rounded-3xl shadow-lg lg:block">
        <Photo src={IMAGES.checkup} alt="Nurse checking a patient's blood pressure" overlay />
        <div className="absolute inset-x-0 bottom-0 space-y-1 p-8 text-white">
          <p className="text-2xl font-bold">Care that reaches you.</p>
          <p className="text-white/80">Your prescriptions, orders and medicine cautions in one place.</p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-xl">
        <h1 className="mb-1 text-3xl font-extrabold tracking-tight">Log in</h1>
        <p className="mb-6 text-muted-foreground">Choose how you want to continue. No password required.</p>
        <div className="space-y-3">
          {accounts.map(({ role, icon: Icon, text }) => {
            const u = primaryUserFor(role);
            return (
              <Card key={role} className={cn("transition hover:border-primary/50", highlight === role && "border-primary ring-2 ring-primary/20")}>
                <CardHeader><CardTitle className="flex items-center gap-2 capitalize"><Icon className="size-4 text-primary" />{role}</CardTitle></CardHeader>
                <CardContent className="flex items-center gap-3">
                  <div className="flex-1 text-sm">
                    <p className="font-medium">{u.name}</p>
                    <p className="text-muted-foreground">{text}</p>
                  </div>
                  <form action={loginAs}>
                    <input type="hidden" name="role" value={role} />
                    <Button type="submit">Continue</Button>
                  </form>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          Admin has no login: the admin panel is available on <code>localhost</code> only (<code>/admin</code>).
        </p>
      </div>
    </div>
  );
}
