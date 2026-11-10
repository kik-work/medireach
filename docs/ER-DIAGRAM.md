# ER Diagram and Data Dictionary — MediReach

The prototype stores each entity as a collection in `.data/db.json` (types in `src/lib/types.ts`). The diagram is drawn as the relational schema a MySQL deployment would use: embedded objects (medicine review, prescription review, payment) become columns, and arrays (prescription items, order lines) become child tables.

```mermaid
erDiagram
    USER ||--o| ACCOUNT : "logs in with"
    USER ||--o| DOCTOR_PROFILE : "doctor has"
    USER }o--o| PHARMACY : "pharmacist manages"
    PHARMACY ||--o{ STOCK_ITEM : lists
    MEDICINE ||--o{ STOCK_ITEM : "is listed as"
    MEDICINE ||--o{ INTERACTION : "source of"
    USER ||--o{ PRESCRIPTION : "doctor issues"
    USER ||--o{ PRESCRIPTION : "patient holds"
    PRESCRIPTION ||--|{ PRESCRIPTION_ITEM : contains
    MEDICINE ||--o{ PRESCRIPTION_ITEM : "prescribed as"
    APPOINTMENT |o--o{ PRESCRIPTION : "written in"
    USER ||--o{ ORDER : places
    PHARMACY ||--o{ ORDER : fulfils
    ORDER ||--|{ ORDER_LINE : contains
    MEDICINE ||--o{ ORDER_LINE : "ordered as"
    REFILL |o--o{ ORDER : "auto-places"
    USER ||--o{ REFILL : subscribes
    MEDICINE ||--o{ REFILL : "refilled"
    PHARMACY ||--o{ REFILL : "supplies"
    USER ||--o{ APPOINTMENT : "patient books"
    USER ||--o{ APPOINTMENT : "doctor attends"
    APPOINTMENT ||--o{ CHAT_MESSAGE : has
    APPOINTMENT ||--o{ MEDICAL_REPORT : has

    USER {
        string id PK
        string name
        string email "email or phone, unique"
        enum role "patient|doctor|pharmacist|admin"
        enum city
        enum status "pending|verified|rejected|suspended"
        string registrationNo "BMDC or Pharmacy Council"
        string pharmacyId FK
    }
    ACCOUNT {
        string userId PK, FK
        string passwordHash "scrypt salt:hash"
    }
    PHARMACY {
        string id PK
        string name
        enum city
        string area
        string address
        string phone
        float rating
        enum status
        string licenseNo "DGDA licence"
        float lat
        float lng
    }
    MEDICINE {
        string id PK
        string slug UK
        string brand
        string generic
        string ingredients "list, lowercase"
        string strength
        enum form "Tablet|Capsule|Syrup|Injection"
        string manufacturer
        string category
        bool rx
        bool rare
        decimal price "reference BDT"
        text description
        text uses
        text cautions
        text sideEffects
        enum reviewStatus "pending|approved|rejected"
        string reviewedBy FK
        date reviewedAt
        string submittedBy FK
    }
    STOCK_ITEM {
        string pharmacyId PK, FK
        string medicineId PK, FK
        int quantity
        decimal price
    }
    INTERACTION {
        string ingredientA PK
        string ingredientB PK
        enum severity "minor|moderate|major"
        text message
        string source FK "medicine whose review added it"
    }
    PRESCRIPTION {
        string id PK
        string doctorId FK "empty for uploads"
        string patientId FK
        date issuedAt
        date validUntil
        string diagnosis
        bool uploaded
        string fileName
        string fileType
        string doctorName "on an uploaded copy"
        string appointmentId FK
        enum reviewStatus "uploads only"
        string reviewedBy FK
    }
    PRESCRIPTION_ITEM {
        string prescriptionId PK, FK
        string medicineId PK, FK
        string dose
        int days
    }
    ORDER {
        string id PK
        string patientId FK
        string pharmacyId FK
        decimal total
        enum status "placed|pre-order|confirmed|packed|delivered|cancelled"
        date createdAt
        bool reserved "stock taken"
        enum paymentMethod "cod|bkash|card"
        enum paymentStatus "unpaid|paid|refunded"
        string paymentRef
        string paymentAccount "last 4 digits"
        string refillId FK
    }
    ORDER_LINE {
        string orderId PK, FK
        string medicineId PK, FK
        int quantity
        decimal unitPrice
    }
    REFILL {
        string id PK
        string patientId FK
        string medicineId FK
        string pharmacyId FK
        int quantity
        int everyDays
        date nextDate
        bool active
        bool autoOrder
        date lastRunAt
        string lastOrderId FK
        string lastError
    }
    DOCTOR_PROFILE {
        string doctorId PK, FK
        string specialty
        string qualifications
        int experienceYears
        decimal fee
        text bio
        text treats
        text languages
        float rating
        bool accepting
        text days
        text times
    }
    APPOINTMENT {
        string id PK
        string patientId FK
        string doctorId FK
        date date
        string time
        enum mode "video|chat"
        text reason
        enum status "requested|approved|rescheduled|declined|cancelled|completed"
        date createdAt
        text doctorNote
        bool callActive
    }
    CHAT_MESSAGE {
        string id PK
        string appointmentId FK
        string senderId FK
        text text
        datetime createdAt
    }
    MEDICAL_REPORT {
        string id PK
        string appointmentId FK
        string patientId FK
        string fileName
        string fileType
        text note
        date uploadedAt
    }
```

## Data dictionary notes

| Entity | Notes |
|---|---|
| USER | One table for all roles. `status` drives access: doctors and pharmacists start `pending`. |
| ACCOUNT | Kept apart from USER so password hashes are never sent with user data. |
| MEDICINE | `ingredients` drive duplicate detection. A row without a review state is approved (starter catalogue). Only approved rows are "live". |
| STOCK_ITEM | One row per pharmacy and medicine. The pharmacy's own price overrides the reference price. |
| INTERACTION | Pair of ingredient names, stored in either order and matched both ways. Curated; doctors add pairs when reviewing a medicine. |
| PRESCRIPTION | Valid 30 days from issue. Uploaded copies (`uploaded = true`) also need `reviewStatus = approved`. The file is stored at `.data/uploads/<id>`. |
| ORDER | One per pharmacy per checkout. Payment columns are simulated; full card or wallet numbers are never stored. |
| REFILL | `autoOrder` off by default. `lastRunAt` limits automatic attempts to one a day. |
| MEDICAL_REPORT | The file is stored at `.data/uploads/<id>`. |

Rare medicines (`MEDICINE.rare`) and nearby search (`PHARMACY.lat/lng`) together support the core objective: finding hard-to-find medicines across the country.
