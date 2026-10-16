import type { Pharmacy } from "@/lib/types";

export const pharmacies: Pharmacy[] = [
  { id: "ph1", name: "Dhanmondi Care Pharmacy", city: "Dhaka", area: "Dhanmondi", address: "Road 27, Dhanmondi, Dhaka", phone: "01700-000001", rating: 4.5, status: "verified", licenseNo: "DGDA-DH-1021" },
  { id: "ph2", name: "Mirpur Health Point", city: "Dhaka", area: "Mirpur", address: "Section 10, Mirpur, Dhaka", phone: "01700-000002", rating: 4.2, status: "verified", licenseNo: "DGDA-DH-1187" },
  { id: "ph3", name: "Gulshan Specialty Pharma", city: "Dhaka", area: "Gulshan", address: "Gulshan-2 Circle, Dhaka", phone: "01700-000003", rating: 4.8, status: "verified", licenseNo: "DGDA-DH-0904" },
  { id: "ph4", name: "Port City Pharmacy", city: "Chattogram", area: "GEC Circle", address: "GEC Circle, Chattogram", phone: "01700-000004", rating: 4.4, status: "verified", licenseNo: "DGDA-CTG-0456" },
  { id: "ph5", name: "Surma Medicine Corner", city: "Sylhet", area: "Zindabazar", address: "Zindabazar, Sylhet", phone: "01700-000005", rating: 4.1, status: "verified", licenseNo: "DGDA-SYL-0233" },
  { id: "ph6", name: "Padma Pharma House", city: "Rajshahi", area: "Shaheb Bazar", address: "Shaheb Bazar, Rajshahi", phone: "01700-000006", rating: 4.3, status: "verified", licenseNo: "DGDA-RAJ-0312" },
  { id: "ph7", name: "Rupsha Drug Store", city: "Khulna", area: "Sonadanga", address: "Sonadanga, Khulna", phone: "01700-000007", rating: 3.9, status: "verified", licenseNo: "DGDA-KHL-0178" },
  { id: "ph8", name: "New Horizon Pharmacy", city: "Dhaka", area: "Uttara", address: "Sector 7, Uttara, Dhaka", phone: "01700-000008", rating: 0, status: "pending", licenseNo: "DGDA-DH-PENDING" },
];
