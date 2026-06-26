import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { X, Download, Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const API = "http://localhost:5000/api";
const token = () => localStorage.getItem("crm_token") || "";

interface TemplateFillModalProps {
  templateId: string;
  templateName: string;
  caseId?: string;
  onClose: () => void;
}

// ── Section header ─────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border rounded-md mb-4">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/40 text-sm font-semibold rounded-t-md hover:bg-muted/60 transition-colors"
        onClick={() => setOpen(!open)}
      >
        {title}
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {open && <div className="px-4 py-4 space-y-4">{children}</div>}
    </div>
  );
}

// ── Auto-fill badge ────────────────────────────────────────────────────────────
function AutoBadge() {
  return (
    <Badge className="text-[10px] bg-yellow-100 text-yellow-800 border-yellow-300 h-4 px-1 ml-1">auto</Badge>
  );
}

// ── Field row ─────────────────────────────────────────────────────────────────
function F({
  label, value, onChange, type = "text", autoFilled = false, placeholder = "", readOnly = false
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; autoFilled?: boolean; placeholder?: string; readOnly?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center mb-1">
        <Label className="text-xs">{label}</Label>
        {autoFilled && <AutoBadge />}
      </div>
      <Input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={cn("h-9 text-sm", autoFilled && "border-yellow-300 bg-yellow-50")}
      />
    </div>
  );
}

function FArea({
  label, value, onChange, rows = 3, autoFilled = false
}: {
  label: string; value: string; onChange: (v: string) => void;
  rows?: number; autoFilled?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center mb-1">
        <Label className="text-xs">{label}</Label>
        {autoFilled && <AutoBadge />}
      </div>
      <Textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        className={cn("text-sm", autoFilled && "border-yellow-300 bg-yellow-50")}
      />
    </div>
  );
}

function FCheck({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <Checkbox checked={checked} onCheckedChange={(c) => onChange(!!c)} />
      {label}
    </label>
  );
}

function FRadio({
  label, name, options, value, onChange
}: {
  label?: string; name: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      {label && <Label className="text-xs mb-2 block">{label}</Label>}
      <div className="flex flex-wrap gap-3">
        {options.map(opt => (
          <label key={opt} className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input
              type="radio"
              name={name}
              value={opt}
              checked={value === opt}
              onChange={() => onChange(opt)}
              className="h-3.5 w-3.5"
            />
            {opt}
          </label>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// OCF-1 FORM — All 7 parts from the actual government PDF
// ════════════════════════════════════════════════════════════════════════════════
function OCF1Form({ fields, set, autoFilled }: {
  fields: Record<string, any>;
  set: (k: string, v: any) => void;
  autoFilled: Set<string>;
}) {
  const chk = (k: string) => !!fields[k];
  const af = (k: string) => autoFilled.has(k);

  return (
    <div>
      {/* Header */}
      <Section title="Form Header">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <F label="Claim Number" value={fields.claimNumber || ""} onChange={v => set("claimNumber", v)} af={af("claimNumber")} />
          <F label="Policy Number" value={fields.policyNumber || ""} onChange={v => set("policyNumber", v)} autoFilled={af("policyNumber")} />
          <F label="Date of Accident (yyyy/mm/dd)" value={fields.dateOfAccident || ""} onChange={v => set("dateOfAccident", v)} type="date" autoFilled={af("dateOfAccident")} />
        </div>
      </Section>

      {/* Part 1 */}
      <Section title="Part 1 — Applicant Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <F label="First Name" value={fields.firstName || ""} onChange={v => set("firstName", v)} autoFilled={af("firstName")} />
          <F label="Last Name" value={fields.lastName || ""} onChange={v => set("lastName", v)} autoFilled={af("lastName")} />
          <F label="Date of Birth (yyyy/mm/dd)" value={fields.dateOfBirth || ""} onChange={v => set("dateOfBirth", v)} type="date" autoFilled={af("dateOfBirth")} />
          <F label="Driver's Licence Number" value={fields.driverLicence || ""} onChange={v => set("driverLicence", v)} autoFilled={af("driverLicence")} />
          <F label="Street Address" value={fields.address || ""} onChange={v => set("address", v)} autoFilled={af("address")} />
          <F label="City" value={fields.city || ""} onChange={v => set("city", v)} autoFilled={af("city")} />
          <F label="Province" value={fields.province || ""} onChange={v => set("province", v)} autoFilled={af("province")} />
          <F label="Postal Code" value={fields.postalCode || ""} onChange={v => set("postalCode", v)} autoFilled={af("postalCode")} />
          <F label="Phone Number" value={fields.phone || ""} onChange={v => set("phone", v)} autoFilled={af("phone")} />
          <F label="E-mail Address" value={fields.email || ""} onChange={v => set("email", v)} autoFilled={af("email")} />
          <F label="Gender" value={fields.gender || ""} onChange={v => set("gender", v)} autoFilled={af("gender")} />
          <F label="Languages Used" value={fields.languages || ""} onChange={v => set("languages", v)} autoFilled={af("languages")} />
        </div>
        <div>
          <Label className="text-xs mb-2 block">Marital Status</Label>
          <div className="flex flex-wrap gap-3">
            {["Separated", "Common-Law", "Married", "Single", "Divorced", "Widow(er)"].map(s => (
              <label key={s} className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="radio" name="maritalStatus" value={s} checked={fields.maritalStatus === s}
                  onChange={() => set("maritalStatus", s)} className="h-3.5 w-3.5" />
                {s}
              </label>
            ))}
          </div>
        </div>
        <FRadio
          label="Consent to electronic communication (if offered by insurer)?"
          name="electronicConsent"
          options={["Yes", "No"]}
          value={fields.electronicConsent || ""}
          onChange={v => set("electronicConsent", v)}
        />
      </Section>

      {/* Part 2 */}
      <Section title="Part 2 — Policy Details">
        <div>
          <Label className="text-xs mb-2 block">Relationship to Policyholder (select all that apply)</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              { key: "relPolicyholder",    label: "I am the Policyholder" },
              { key: "relSpouse",          label: "Spouse of Policyholder" },
              { key: "relListedDriver",    label: "Listed Driver" },
              { key: "relEmployee",        label: "Employee of the Policyholder" },
              { key: "relRental",          label: "A vehicle you rented or leased for more than 30 days" },
              { key: "relDependent",       label: "Dependent of the Policyholder or the Policyholder's spouse" },
              { key: "relNoRelationship",  label: "I have no relationship to the Policyholder" },
            ].map(r => (
              <FCheck key={r.key} label={r.label} checked={chk(r.key)} onChange={v => set(r.key, v)} />
            ))}
          </div>
        </div>
        <FRadio
          label="Are you aware of any coverage under any other automobile policies that would apply to you?"
          name="otherCoverage"
          options={["Yes", "No", "I don't know"]}
          value={fields.otherCoverage || ""}
          onChange={v => set("otherCoverage", v)}
        />
        {fields.otherCoverage === "Yes" && (
          <FArea
            label="If yes, list insurer(s) and policy number(s)"
            value={fields.otherCoverageDetails || ""}
            onChange={v => set("otherCoverageDetails", v)}
            rows={2}
          />
        )}
        <div>
          <Label className="text-xs mb-2 block">How were you involved in the accident?</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              { key: "invDriver",      label: "Driver of Vehicle Insured under this Policy" },
              { key: "invPassenger",   label: "Passenger of Vehicle Insured under this Policy" },
              { key: "invPedestrian",  label: "Pedestrian or Cyclist" },
              { key: "invOtherVehicle",label: "Driver or Passenger of a vehicle not insured under this Policy" },
            ].map(r => (
              <FCheck key={r.key} label={r.label} checked={chk(r.key)} onChange={v => set(r.key, v)} />
            ))}
          </div>
          <div className="mt-2">
            <F label="Other involvement — provide details" value={fields.invOtherDetails || ""} onChange={v => set("invOtherDetails", v)} />
          </div>
        </div>
      </Section>

      {/* Part 3 */}
      <Section title="Part 3 — Accident Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <F label="Location of Accident (Intersection, City, Province/State)" value={fields.accidentLocation || ""} onChange={v => set("accidentLocation", v)} autoFilled={af("accidentLocation")} />
          <div className="grid grid-cols-2 gap-2">
            <F label="Date of Accident" value={fields.dateOfAccident || ""} onChange={v => set("dateOfAccident", v)} type="date" autoFilled={af("dateOfAccident")} />
            <F label="Time" value={fields.timeOfAccident || ""} onChange={v => set("timeOfAccident", v)} type="time" />
          </div>
        </div>
        <FArea
          label="Give a brief description of the accident. Describe all injuries sustained as a result of the accident."
          value={fields.accidentDescription || ""}
          onChange={v => set("accidentDescription", v)}
          rows={4}
          autoFilled={af("accidentDescription")}
        />
        <div>
          <Label className="text-xs mb-2 block">Select all that apply</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              { key: "wentToCollision",   label: "Went to collision reporting centre" },
              { key: "policeAttended",     label: "Police attended" },
              { key: "ambulanceAttended",  label: "Ambulance attended" },
              { key: "wentToHospital",     label: "Went to the hospital" },
              { key: "wentToDoctor",       label: "Went to doctor/nurse practitioner/other Regulated Healthcare Provider" },
            ].map(r => (
              <FCheck key={r.key} label={r.label} checked={chk(r.key)} onChange={v => set(r.key, v)} />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FRadio label="Were you charged?" name="wereYouCharged" options={["Yes", "No"]} value={fields.wereYouCharged || ""} onChange={v => set("wereYouCharged", v)} />
          {fields.wereYouCharged === "Yes" && (
            <F label="If yes, list charge" value={fields.chargeDetails || ""} onChange={v => set("chargeDetails", v)} />
          )}
          <FRadio label="Did the accident happen while you were working?" name="accidentAtWork" options={["Yes", "No"]} value={fields.accidentAtWork || ""} onChange={v => set("accidentAtWork", v)} />
          <FRadio label="Did the accident happen while travelling to and/or from work?" name="accidentCommute" options={["Yes", "No"]} value={fields.accidentCommute || ""} onChange={v => set("accidentCommute", v)} />
        </div>
      </Section>

      {/* Part 4 */}
      <Section title="Part 4 — Applicant Status at Time of Accident">
        <div>
          <Label className="text-xs mb-2 block">Select all that apply</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[
              { key: "statusFullTime",   label: "Working Full-Time" },
              { key: "statusPartTime",   label: "Working Part-Time" },
              { key: "statusSelfEmployed", label: "Self-Employed" },
              { key: "statusUnemployed", label: "Unemployed" },
              { key: "statusEI",         label: "Receiving Employment Insurance" },
              { key: "statusRetired",    label: "Retired" },
              { key: "statusStudent",    label: "Student" },
              { key: "statusCaregiver",  label: "Caregiver" },
              { key: "status26Weeks",    label: "Worked 26 weeks in past 52 weeks" },
              { key: "statusWSIB",       label: "Receiving WSIB Benefits" },
            ].map(r => (
              <FCheck key={r.key} label={r.label} checked={chk(r.key)} onChange={v => set(r.key, v)} />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {[
            { key: "missedActivities", label: "Missed time from pre-accident activities", dateKey: "returnedActivities" },
            { key: "missedWork",       label: "Missed time from work",                   dateKey: "returnedWork" },
            { key: "missedSchool",     label: "Missed time from school",                 dateKey: "returnedSchool" },
          ].map(r => (
            <div key={r.key} className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
              <FRadio label={r.label} name={r.key} options={["Yes", "No", "N/A"]} value={fields[r.key] || ""} onChange={v => set(r.key, v)} />
              {fields[r.key] === "Yes" && (
                <F label="Date returned (yyyy/mm/dd)" value={fields[r.dateKey] || ""} onChange={v => set(r.dateKey, v)} type="date" />
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Part 5 */}
      <Section title="Part 5 — Other Insurance">
        <FRadio
          label="Do you, your spouse or anyone you are dependent on have any other benefit plan that covers you (e.g. disability benefits)?"
          name="hasOtherBenefits"
          options={["Yes", "No"]}
          value={fields.hasOtherBenefits || ""}
          onChange={v => set("hasOtherBenefits", v)}
        />
        {fields.hasOtherBenefits === "Yes" && (
          <>
            <FArea label="Name of benefit companies and policy number(s)" value={fields.otherBenefitDetails || ""} onChange={v => set("otherBenefitDetails", v)} rows={2} />
            <div>
              <Label className="text-xs mb-2 block">Type of Coverage (select all that apply)</Label>
              <div className="flex flex-wrap gap-3">
                {["Medical", "Dental", "Short Term Disability", "Long Term Disability", "Other"].map(t => (
                  <FCheck key={t} label={t} checked={chk(`coverage_${t.replace(/\s/g,"_")}`)} onChange={v => set(`coverage_${t.replace(/\s/g,"_")}`, v)} />
                ))}
              </div>
            </div>
          </>
        )}
      </Section>

      {/* Part 6 */}
      <Section title="Part 6 — Authorization for Direct Payment to Service Provider">
        <p className="text-xs text-muted-foreground">
          I direct the insurer, including the Motor Vehicle Accident Claims Fund, to pay the licensed service provider directly for that portion of the approved goods and services specified in separate forms, Treatment Confirmation Form (OCF-23) and Treatment and Assessment Plan (OCF-18), that are not covered by extended/supplementary health insurance.
        </p>
        <F label="Initials of Applicant or Substitute Decision Maker" value={fields.part6Initials || ""} onChange={v => set("part6Initials", v)} />
      </Section>

      {/* Part 7 + Signatures */}
      <Section title="Part 7 — Signatures & Certification">
        <p className="text-xs text-muted-foreground mb-3">
          I certify that I have read this part and understand that this application for accident benefits is not complete until the required forms are completed, signed and provided to the MVACF.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <F label="Name of Applicant or Substitute Decision Maker" value={fields.sigName || ""} onChange={v => set("sigName", v)} autoFilled={af("sigName")} />
          <F label="Signature (type full name)" value={fields.signature || ""} onChange={v => set("signature", v)} />
          <F label="Date Signed (yyyy/mm/dd)" value={fields.dateSigned || ""} onChange={v => set("dateSigned", v)} type="date" />
        </div>
      </Section>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// Generic form for other OCF forms (OCF-2 through OCF-23, matrix-intake)
// These use the same field layout as before but correctly named
// ════════════════════════════════════════════════════════════════════════════════
function getGenericFields(templateId: string): { key: string; label: string }[] {
  const base = [
    { key: "lastName",       label: "Last Name" },
    { key: "firstName",      label: "First Name" },
    { key: "dateOfBirth",    label: "Date of Birth (yyyy/mm/dd)" },
    { key: "address",        label: "Street Address" },
    { key: "city",           label: "City" },
    { key: "province",       label: "Province" },
    { key: "postalCode",     label: "Postal Code" },
    { key: "phone",          label: "Phone Number" },
    { key: "email",          label: "Email" },
    { key: "claimNumber",    label: "Claim Number" },
    { key: "policyNumber",   label: "Policy Number" },
    { key: "dateOfAccident", label: "Date of Accident (yyyy/mm/dd)" },
    { key: "fileNo",         label: "File No." },
  ];
  if (templateId === "ocf-10") return [
    ...base.slice(0, 4),
    { key: "claimNumber",     label: "Claim Number" },
    { key: "dateOfAccident",  label: "Date of Accident (yyyy/mm/dd)" },
    { key: "fileNo",          label: "File No." },
    { key: "benefitElection", label: "Benefit Election (IRB / Non-Earner / Caregiver)" },
  ];
  if (templateId === "ocf-6") return [
    ...base,
    { key: "homeTelephone",   label: "Home Telephone" },
  ];
  if (templateId === "matrix-intake") return [
    ...base,
    { key: "maritalStatus",   label: "Marital Status" },
    { key: "dependants",      label: "Number of Dependants" },
    { key: "referredBy",      label: "Referred By" },
    { key: "interviewedBy",   label: "Interviewed By" },
    { key: "clerkAssigned",   label: "Clerk Assigned" },
  ];
  return base;
}

// ════════════════════════════════════════════════════════════════════════════════
// Main Modal
// ════════════════════════════════════════════════════════════════════════════════
export default function TemplateFillModal({ templateId, templateName, caseId, onClose }: TemplateFillModalProps) {
  const { toast } = useToast();
  const [allCases, setAllCases] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState(caseId || "");
  const [fields, setFields] = useState<Record<string, any>>({});
  const [autoFilled, setAutoFilled] = useState<Set<string>>(new Set());
  // OCF-6 expense rows
  const [expenses, setExpenses] = useState<{ date: string; description: string; amount: string }[]>([]);

  const isOcf1 = templateId === "ocf-1";
  const isOcf6 = templateId === "ocf-6";

  function setField(k: string, v: any) {
    setFields(prev => ({ ...prev, [k]: v }));
  }

  // Load cases list
  useEffect(() => {
    fetch(`${API}/cases`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => setAllCases(Array.isArray(data) ? data : []));
  }, []);

  // Auto-fill from case when selected
  useEffect(() => {
    if (!selectedCaseId) return;
    fetch(`${API}/cases/${selectedCaseId}`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.ok ? r.json() : null)
      .then(c => {
        if (!c) return;
        const map: Record<string, string> = {
          firstName:           c.client?.firstName      || "",
          lastName:            c.client?.lastName       || "",
          address:             c.clientStreet           || c.client?.address || "",
          city:                c.clientCity             || c.client?.city    || "",
          province:            c.clientState            || c.client?.province || "ON",
          postalCode:          c.clientZip              || c.client?.postCode || "",
          dateOfBirth:         c.client?.dateOfBirth    ? c.client.dateOfBirth.split("T")[0] : "",
          phone:               c.clientMobile           || c.client?.cellPhone || c.client?.homePhone || "",
          email:               c.client?.email          || "",
          maritalStatus:       c.client?.maritalStatus  || "",
          dependants:          String(c.client?.dependants ?? ""),
          dateOfAccident:      c.dateOfLoss             ? c.dateOfLoss.split("T")[0] : "",
          fileNo:              c.fileNo                 || "",
          claimNumber:         c.claimNo                || "",
          policyNumber:        c.policyNo               || "",
          referredBy:          c.referredBy             || "",
          interviewedBy:       c.clerkAssigned          || "",
          clerkAssigned:       c.clerkAssigned          || "",
          sigName:             `${c.client?.firstName || ""} ${c.client?.lastName || ""}`.trim(),
          driverLicence:       c.client?.driverLicence  || "",
          languages:           "",
          accidentLocation:    c.accidentLocation       || "",
          accidentDescription: c.accidentDescription    || "",
        };
        const autoKeys = new Set(
          Object.entries(map).filter(([, v]) => v !== "").map(([k]) => k)
        );
        setFields(prev => ({ ...prev, ...Object.fromEntries(Object.entries(map).filter(([, v]) => v !== "")) }));
        setAutoFilled(autoKeys);
      });
  }, [selectedCaseId]);

  // Export as text blob — faithfully reproduces all form parts
  function exportText() {
    const lines: string[] = [
      `${templateName}`,
      `${"=".repeat(60)}`,
      `File No: ${fields.fileNo || ""}`,
      `Claim Number: ${fields.claimNumber || ""}`,
      `Policy Number: ${fields.policyNumber || ""}`,
      `Date of Accident: ${fields.dateOfAccident || ""}`,
      "",
    ];

    if (isOcf1) {
      lines.push("PART 1 — Applicant Information");
      lines.push(`Name: ${fields.firstName || ""} ${fields.lastName || ""}`);
      lines.push(`Date of Birth: ${fields.dateOfBirth || ""}`);
      lines.push(`Driver's Licence: ${fields.driverLicence || ""}`);
      lines.push(`Address: ${fields.address || ""}, ${fields.city || ""}, ${fields.province || ""} ${fields.postalCode || ""}`);
      lines.push(`Phone: ${fields.phone || ""}  Email: ${fields.email || ""}`);
      lines.push(`Gender: ${fields.gender || ""}  Languages: ${fields.languages || ""}`);
      lines.push(`Marital Status: ${fields.maritalStatus || ""}  Electronic Consent: ${fields.electronicConsent || ""}`);
      lines.push("");
      lines.push("PART 2 — Policy Details");
      const relFields = ["relPolicyholder","relSpouse","relListedDriver","relEmployee","relRental","relDependent","relNoRelationship"];
      const relLabels = ["Policyholder","Spouse","Listed Driver","Employee","Rental","Dependent","No Relationship"];
      const selected = relFields.filter((k,i) => fields[k]).map((_,i) => relLabels[i]);
      lines.push(`Relationship to policyholder: ${selected.join(", ") || "None selected"}`);
      lines.push(`Other auto coverage: ${fields.otherCoverage || ""}${fields.otherCoverageDetails ? " — "+fields.otherCoverageDetails : ""}`);
      const invLabels = ["Driver (insured)","Passenger (insured)","Pedestrian/Cyclist","Driver/Passenger (not insured)"];
      const invKeys = ["invDriver","invPassenger","invPedestrian","invOtherVehicle"];
      lines.push(`Involvement: ${invKeys.filter(k=>fields[k]).map((_,i)=>invLabels[i]).join(", ") || "None selected"}`);
      if (fields.invOtherDetails) lines.push(`Other involvement: ${fields.invOtherDetails}`);
      lines.push("");
      lines.push("PART 3 — Accident Details");
      lines.push(`Location: ${fields.accidentLocation || ""}`);
      lines.push(`Time: ${fields.timeOfAccident || ""}`);
      lines.push(`Description: ${fields.accidentDescription || ""}`);
      const responseItems = ["wentToCollision:Collision centre","policeAttended:Police","ambulanceAttended:Ambulance","wentToHospital:Hospital","wentToDoctor:Doctor/HCP"];
      lines.push(`Response: ${responseItems.filter(r=>fields[r.split(":")[0]]).map(r=>r.split(":")[1]).join(", ") || "None"}`);
      lines.push(`Charged: ${fields.wereYouCharged || ""}${fields.chargeDetails ? " — "+fields.chargeDetails : ""}`);
      lines.push(`At work: ${fields.accidentAtWork || ""}  Commuting: ${fields.accidentCommute || ""}`);
      lines.push("");
      lines.push("PART 4 — Applicant Status");
      const statusKeys = [["statusFullTime","Full-Time"],["statusPartTime","Part-Time"],["statusSelfEmployed","Self-Employed"],["statusUnemployed","Unemployed"],["statusEI","EI"],["statusRetired","Retired"],["statusStudent","Student"],["statusCaregiver","Caregiver"],["status26Weeks","26 weeks"],["statusWSIB","WSIB"]];
      lines.push(`Status: ${statusKeys.filter(([k])=>fields[k]).map(([,l])=>l).join(", ") || "None"}`);
      lines.push(`Missed activities: ${fields.missedActivities || ""}${fields.returnedActivities ? " (returned "+fields.returnedActivities+")" : ""}`);
      lines.push(`Missed work: ${fields.missedWork || ""}${fields.returnedWork ? " (returned "+fields.returnedWork+")" : ""}`);
      lines.push(`Missed school: ${fields.missedSchool || ""}${fields.returnedSchool ? " (returned "+fields.returnedSchool+")" : ""}`);
      lines.push("");
      lines.push("PART 5 — Other Insurance");
      lines.push(`Other benefits: ${fields.hasOtherBenefits || ""}${fields.otherBenefitDetails ? " — "+fields.otherBenefitDetails : ""}`);
      lines.push("");
      lines.push("PART 6 — Authorization");
      lines.push(`Initials: ${fields.part6Initials || ""}`);
      lines.push("");
      lines.push("SIGNATURES");
      lines.push(`Name: ${fields.sigName || ""}  Signature: ${fields.signature || ""}  Date: ${fields.dateSigned || ""}`);
    } else {
      // Generic OCF forms
      const flds = getGenericFields(templateId);
      flds.forEach(f => lines.push(`${f.label}: ${fields[f.key] || ""}`));
    }

    if (isOcf6 && expenses.length > 0) {
      lines.push("\nEXPENSE ITEMS:");
      expenses.forEach((e, i) => lines.push(`  ${i+1}. ${e.date} — ${e.description} — $${e.amount}`));
      lines.push(`\nTotal: $${expenses.reduce((s, e) => s + (parseFloat(e.amount)||0), 0).toFixed(2)}`);
    }

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: `${templateName.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().slice(0,10)}.txt`,
    });
    a.click();
    toast({ title: "Exported successfully", description: templateName });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-background z-10">
          <div>
            <h2 className="text-base font-semibold">{templateName}</h2>
            <p className="text-xs text-muted-foreground">Government of Ontario — AF-145E (2026)</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        {/* Case pre-fill selector */}
        <div className="px-6 py-3 border-b bg-muted/30 sticky top-[65px] z-10">
          <Label className="text-xs mb-1 block font-medium">Pre-fill from case</Label>
          <div className="flex items-center gap-3">
            <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
              <SelectTrigger className="h-9 text-sm w-96">
                <SelectValue placeholder="Select a case to auto-fill fields..." />
              </SelectTrigger>
              <SelectContent>
                {allCases.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.fileNo} — {c.client?.firstName} {c.client?.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {autoFilled.size > 0 && (
              <span className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-1 rounded">
                {autoFilled.size} fields auto-filled
              </span>
            )}
          </div>
        </div>

        {/* Form body */}
        <div className="px-6 py-4">
          {isOcf1 ? (
            <OCF1Form fields={fields} set={setField} autoFilled={autoFilled} />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                {getGenericFields(templateId).map(f => (
                  <div key={f.key}>
                    <div className="flex items-center mb-1">
                      <Label className="text-xs">{f.label}</Label>
                      {autoFilled.has(f.key) && <AutoBadge />}
                    </div>
                    <Input
                      value={fields[f.key] || ""}
                      onChange={e => setField(f.key, e.target.value)}
                      className={cn("h-9 text-sm", autoFilled.has(f.key) && "border-yellow-300 bg-yellow-50")}
                    />
                  </div>
                ))}
              </div>

              {isOcf6 && (
                <div className="mt-4 border rounded-md p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-semibold">Expense Items</Label>
                    <Button size="sm" variant="outline" onClick={() => setExpenses(e => [...e, { date: "", description: "", amount: "" }])}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Expense
                    </Button>
                  </div>
                  {expenses.length === 0 && (
                    <p className="text-xs text-muted-foreground">No expenses added yet.</p>
                  )}
                  {expenses.map((exp, i) => (
                    <div key={i} className="grid grid-cols-[1fr_2fr_1fr_auto] gap-2 mb-2">
                      <Input placeholder="Date" type="date" value={exp.date} onChange={e => setExpenses(p => p.map((x,j) => j===i ? {...x,date:e.target.value} : x))} className="h-8 text-xs" />
                      <Input placeholder="Description" value={exp.description} onChange={e => setExpenses(p => p.map((x,j) => j===i ? {...x,description:e.target.value} : x))} className="h-8 text-xs" />
                      <Input placeholder="$0.00" value={exp.amount} onChange={e => setExpenses(p => p.map((x,j) => j===i ? {...x,amount:e.target.value} : x))} className="h-8 text-xs" />
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setExpenses(p => p.filter((_,j) => j!==i))}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  {expenses.length > 0 && (
                    <p className="text-xs text-right font-medium">
                      Total: ${expenses.reduce((s,e) => s+(parseFloat(e.amount)||0), 0).toFixed(2)}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t sticky bottom-0 bg-background">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={exportText}>
            <Download className="h-4 w-4 mr-1" /> Export as Text
          </Button>
        </div>
      </div>
    </div>
  );
}