import { ConsultRoom } from "@/components/consult/consult-room";

export const metadata = { title: "Consultation" };

export default async function Page({ params }: PageProps<"/patient/appointments/[id]">) {
  return <ConsultRoom id={(await params).id} />;
}
