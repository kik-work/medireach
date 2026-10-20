import { Photo } from "@/components/shared/photo";
import { IMAGES } from "@/lib/images";

/** Two-column frame shared by the log in and sign up pages. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div className="relative hidden aspect-[4/5] overflow-hidden rounded-3xl shadow-lg lg:block">
        <Photo src={IMAGES.checkup} alt="Nurse checking a patient's blood pressure" overlay />
        <div className="absolute inset-x-0 bottom-0 space-y-1 p-8 text-white">
          <p className="text-2xl font-bold">Care that reaches you.</p>
          <p className="text-white/80">Your prescriptions, orders and medicine cautions in one place.</p>
        </div>
      </div>
      {children}
    </div>
  );
}
