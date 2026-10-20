import { PatientOverview } from "@/components/dashboard/patient-views";

export const metadata = { title: "Patient dashboard" };

export default function PatientHome() {
  return <PatientOverview />;
}
