export const PROVINCES = [
  "Alberta", "British Columbia", "Manitoba", "New Brunswick",
  "Newfoundland and Labrador", "Northwest Territories", "Nova Scotia",
  "Nunavut", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Yukon",
];

export const MARITAL_STATUSES = ["Single", "Married", "Common-Law", "Separated", "Divorced", "Widow"];

export const CASE_TYPES = [
  "Motor Vehicle Accident (MVA)",
  "Slip and Fall",
  "Traffic Accident",
  "Immigration",
] as const;

export type CaseType = typeof CASE_TYPES[number];

// Hierarchical document categories
export interface DocumentCategory {
  id: string;
  name: string;
  parentId: string | null;
  level: number;
  children?: DocumentCategory[];
}

export const DOCUMENT_CATEGORY_TREE: DocumentCategory[] = [
  {
    id: "mva", name: "Motor Vehicle (MVA)", parentId: null, level: 0, children: [
      {
        id: "mva-ab", name: "AB (Accident Benefits)", parentId: "mva", level: 1, children: [
          { id: "mva-ab-insurance", name: "Insurance", parentId: "mva-ab", level: 2 },
          { id: "mva-ab-family-doctor", name: "Medical - Family Doctor", parentId: "mva-ab", level: 2 },
          { id: "mva-ab-assessment", name: "Assessment Report", parentId: "mva-ab", level: 2 },
          {
            id: "mva-ab-specialist", name: "Specialist Report", parentId: "mva-ab", level: 2, children: [
              { id: "mva-ab-specialist-neuro", name: "Neurological", parentId: "mva-ab-specialist", level: 3 },
              { id: "mva-ab-specialist-mental", name: "Mental Health", parentId: "mva-ab-specialist", level: 3 },
              { id: "mva-ab-specialist-ortho", name: "Orthopedic", parentId: "mva-ab-specialist", level: 3 },
              { id: "mva-ab-specialist-other", name: "Other", parentId: "mva-ab-specialist", level: 3 },
            ]
          },
          { id: "mva-ab-ireport", name: "I Report", parentId: "mva-ab", level: 2 },
          { id: "mva-ab-police", name: "Police Report", parentId: "mva-ab", level: 2 },
          { id: "mva-ab-other", name: "Other Documents", parentId: "mva-ab", level: 2 },
        ]
      },
      { id: "mva-tort", name: "Tort", parentId: "mva", level: 1 },
    ]
  },
  { id: "slip-fall", name: "Slip and Fall", parentId: null, level: 0 },
  { id: "traffic", name: "Traffic Accident", parentId: null, level: 0 },
  { id: "immigration", name: "Immigration", parentId: null, level: 0 },
];

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
