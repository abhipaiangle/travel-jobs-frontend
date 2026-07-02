// Doc type dropdowns mirror HelloTravel's signup-step2 verification form so
// admins reviewing KYC across both systems see the same categories.
// Values are stable identifiers (as stored on HelloTravel); labels are what
// the employer sees.

export const REGISTRATION_PROOF_TYPES = [
  { value: "GST", label: "GST" },
  { value: "Current A/c Latest Statement", label: "Current A/c Latest Statement" },
  { value: "Current A/c Cancelled Cheque", label: "Current A/c Cancelled Cheque" },
  { value: "Udyog Aadhaar", label: "Udyog Aadhaar" },
  { value: "PAN", label: "Company PAN" },
  { value: "Partnership Deed", label: "Partnership Deed" },
  { value: "Incorporation Certificate", label: "Incorporation Certificate" },
];

export const ADDRESS_PROOF_TYPES = [
  { value: "Elect", label: "Elect / Phone / Water / Property Tax Bill or Receipt (in company / prop. name)" },
  { value: "Current A/c Latest Statement", label: "Current A/c Latest Statement" },
  { value: "Udyog Aadhaar", label: "Udyog Aadhaar" },
  { value: "Rent Agreement", label: "Rent Agreement (Registered, non-notarized, in company / prop. name)" },
];

export const PROOF_TYPE_LABEL = Object.fromEntries(
  [...REGISTRATION_PROOF_TYPES, ...ADDRESS_PROOF_TYPES].map((o) => [o.value, o.label])
);
