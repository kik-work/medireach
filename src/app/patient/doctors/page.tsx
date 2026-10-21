import { PatientDoctors } from "@/components/consult/doctor-finder";

export const metadata = { title: "Find a doctor" };

export default async function Page({ searchParams }: PageProps<"/patient/doctors">) {
  const { specialty } = await searchParams;
  return <PatientDoctors initialSpecialty={typeof specialty === "string" ? specialty : ""} />;
}
