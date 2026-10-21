import { DoctorNewPrescription } from "@/components/dashboard/doctor-views";

export const metadata = { title: "New prescription" };

export default async function NewPrescriptionPage({ searchParams }: PageProps<"/doctor/prescriptions/new">) {
  const { patientId, appointmentId } = await searchParams;
  return (
    <DoctorNewPrescription
      patientId={typeof patientId === "string" ? patientId : undefined}
      appointmentId={typeof appointmentId === "string" ? appointmentId : undefined}
    />
  );
}
