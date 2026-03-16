export const PROVINCES = [
  "Alberta", "British Columbia", "Manitoba", "New Brunswick",
  "Newfoundland and Labrador", "Northwest Territories", "Nova Scotia",
  "Nunavut", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Yukon",
];

export const MARITAL_STATUSES = ["Single", "Married", "Common-Law", "Separated", "Divorced", "Widow"];

export const FILE_STATUSES = ["Active", "Closed", "Pending", "On Hold", "Settled", "Litigation", "Mediation", "Arbitration"];

export const ACTIVITY_TYPES = ["Note", "Task", "Call", "Email", "Appointment"] as const;

export const DOCUMENT_CATEGORIES = [
  "Medical Reports", "Insurance Forms", "Legal Documents",
  "Police Reports", "Client Documents", "OCF Forms", "Other",
];

export const OCF_FORMS = [
  { id: "ocf-3", name: "OCF-3", description: "Disability Certificate" },
  { id: "ocf-6", name: "OCF-6", description: "Expenses Claim Form" },
  { id: "ocf-9", name: "OCF-9", description: "Assessment of Attendant Care Needs" },
  { id: "ocf-10", name: "OCF-10", description: "Election of Benefits Form" },
  { id: "ocf-18", name: "OCF-18", description: "Treatment Plan" },
  { id: "ocf-23", name: "OCF-23", description: "Notice of Claim for Loss of Income" },
];

export const CAR_MAKES = ["Toyota", "Honda", "Ford", "Chevrolet", "Hyundai", "Kia", "Nissan", "BMW", "Mercedes-Benz", "Volkswagen", "Mazda", "Subaru", "Audi", "Lexus", "Jeep", "Ram", "GMC", "Dodge"];

export const JOB_DESCRIPTIONS = ["Office Worker", "Manual Labour", "Professional", "Sales", "Healthcare", "Education", "Construction", "Transportation", "Retail", "Food Service", "Self-Employed", "Other"];

export const PHYSICAL_CONDITIONS = [
  "Head", "Face", "Eyes", "Nose", "Ears", "Jaw", "Teeth", "Neck", "Shoulders",
  "Arms", "Wrists", "Hands", "Fingers", "Chest", "Ribs", "Abdomen", "Upper Back",
  "Mid Back", "Lower Back", "Hips", "Pelvis", "Thighs", "Knees", "Legs", "Ankles", "Feet", "Toes",
];

export const NEUROLOGICAL_CONDITIONS = [
  "Headaches", "Dizziness", "Ringing in ears", "Hearing problems",
  "Blurred Vision", "Forgetfulness", "Tingling", "Numbness",
];

export const PSYCHOLOGICAL_CONDITIONS = [
  "Irritability", "Anxiety", "Stress", "Depression", "Lack of sleep",
  "Nightmares", "Flashbacks to MVA", "Periodic crying", "Low self-esteem",
  "Loss of incentive", "Fear of driving", "Nervous when passenger",
  "Withdraw from others", "Poor appetite", "Loss of weight",
  "Decrease sex drive", "Fatigue/low energy", "Short-tempered",
  "Spousal arguments", "Over-react to small things", "Excessive worry", "Suicidal thoughts",
];

export const LAW_FIRMS = ["Smith & Associates LLP", "Johnson Legal Group", "Williams & Partners", "Brown Law Firm", "Davis & Co. Legal"];
export const LAWYERS = ["John Smith", "Sarah Johnson", "Michael Williams", "Emily Brown", "David Davis"];
export const ASSESSMENT_COMPANIES = ["Unison Medical Assessments", "InHouse Medical Corp", "Sibley & Associates", "Premier Assessments Inc."];
