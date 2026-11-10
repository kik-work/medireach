# User Guide — MediReach

MediReach is a prototype. Verification, payment and delivery are simulated, and no real medicine is sold. Demo accounts are listed in the [README](../README.md#demo-accounts).

## Everyone

**Find a medicine.** Open **Medicines** and search by brand (Napa), generic (paracetamol) or condition (fever). Tick **Rare only** to see hard-to-find medicines.

**See where it is in stock.** On a medicine page, press **Near me** and allow location to list pharmacies within 10 km first, nearest first. Or pick a city. Pharmacies elsewhere in Bangladesh are listed below, so a rare medicine can be found even if no local shop has it.

**Read the cautions.** The **AI caution layer** panel shows what the medicine treats, its cautions, and warnings about other brands with the same ingredient. All facts come from a curated database checked by doctors. When a plain-language summary appears at the top, it is a rewording of those same facts. It always ends with: *This is general information. Follow your doctor's instructions.*

## Patient

**Sign up** at **Sign up** → Patient. Your account is active at once.

**Get a prescription.**
- From a doctor on MediReach: book a consultation (below). The doctor's prescription appears under **Prescriptions** and is valid for 30 days.
- From a paper prescription: open **Prescriptions** and use the upload form. Enter the doctor's name, date and medicines, and attach a clear photo or PDF (JPEG, PNG, WebP or PDF, up to 3 MB). It shows **Pending** until an admin checks it, then **Valid**.

**Order.**
1. On a medicine page, press **Add** next to a pharmacy.
2. Open the **Cart**. Read the caution panel. When you are signed in, it also checks your current prescriptions, refills and recent orders, and marks those medicines "on your profile".
3. Rx medicines need a valid prescription. Without one the cart tells you which item is blocked.
4. Choose a payment method:
   - **Cash on delivery:** pay the pharmacy when it arrives.
   - **bKash:** any number like `01712345678` (simulated).
   - **Card:** `4242 4242 4242 4242` with any future expiry (simulated).
5. Press **Place order**. Items from different pharmacies become separate orders. If a pharmacy is out of stock, that order is a **pre-order**; the pharmacy confirms when the stock arrives.

**Track or cancel.** **Orders** shows each step (Placed, Confirmed, Packed, Delivered) and the payment state. You can cancel until the pharmacy confirms; a prepaid order is then marked refunded.

**Refills for long-term medicines.** **Refills → New refill**: choose medicine, pharmacy, number of packs and how often. The dashboard reminds you a week ahead. Press **Order now** at any time, or tick **Place the order automatically on the due date** to have it ordered for you (cash on delivery). If an automatic order fails, for example because your prescription expired, the refill card says why; it tries again the next day.

**Consult a doctor.** **Doctors**: describe what is wrong in your own words, or browse by specialty. The finder suggests the kind of doctor; it does not diagnose. Pick a time and video or chat. Under **Appointments**, open the consultation to chat, join the (demo) call and attach test reports. Only you and that doctor can open your reports.

## Doctor

**Sign up** as Doctor with your BMDC number. You can use the dashboard while pending, but you can issue prescriptions, review medicines and take bookings only after an admin verifies you.

- **Practice profile** (Appointments page): specialty, fee, conditions you treat, working days and times, and **Accepting** (switch off when on leave).
- **Appointments:** approve, reschedule with a note, or decline requests. Open a consultation to chat, call, read reports, and write a prescription linked to it.
- **New prescription:** choose the patient, diagnosis and each medicine with dose and days. It is valid for 30 days. Edit or revoke it from **Prescriptions**.
- **Medicine review:** new catalogue entries wait for you. Write the description, uses, cautions, side effects and interactions, then approve, or reject with a reason. Only approved medicines are visible to anyone.

## Pharmacist

**Sign up** as Pharmacist with your Pharmacy Council number, pharmacy name and DGDA licence number. Your pharmacy stays hidden until an admin verifies both you and the pharmacy. While pending you can prepare your inventory.

- **Pharmacy:** address, phone and map position (used for "Near me" search).
- **Inventory:** add each medicine you stock with quantity and your price. Keep it current; customers rely on it. Once verified, you can also propose a medicine that is missing from the catalogue; a doctor reviews it first.
- **Orders:** move each order one step at a time: Confirm → Packed → Delivered. Marking a cash order delivered records the cash as collected. For Rx items, open the customer's uploaded prescription from the order. Cancel an order you cannot fulfil; reserved stock returns to your inventory.

## Admin

Open `/admin` and sign in.

- **Verifications:** verify, reject, suspend or reinstate doctors, pharmacists and pharmacies. Check uploaded prescriptions: open the file, then approve or reject with a reason.
- **Medicines:** add a medicine (brand, generic, strength, form, price, Rx). It goes to doctor review before it is live. Changing its generic, strength, form or Rx flag sends it back to review.
- **Pharmacies** and **Orders:** see everything; cancel orders that need it.
- **API docs:** the REST API reference.

## Troubleshooting

| Message | Meaning |
|---|---|
| "A valid prescription is required for Rx-only medicines." | Ask a doctor for a prescription, or upload one and wait for approval. Check it has not expired. |
| "Your registration must be verified first." | An admin has not verified your doctor or pharmacist account yet. |
| "Card declined (simulated)." / "Payment declined by bKash (simulated)." | You used a test number that is declined on purpose. Use another or cash on delivery. |
| Caution summary not shown | The plain-language summary is optional. The caution cards below it contain all the information. |
