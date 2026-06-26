import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { X, Download, Plus, Trash2, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const API = "http://localhost:5000/api";
const tok = () => localStorage.getItem("crm_token") || "";

interface TemplateFillModalProps {
  templateId: string;
  templateName: string;
  caseId?: string;
  onClose: () => void;
}

// ── Shared helper components ──────────────────────────────────────────────────
function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border rounded-md mb-3 overflow-hidden">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:bg-muted transition-colors">
        {title}
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {open && <div className="px-4 py-4 space-y-3">{children}</div>}
    </div>
  );
}

function AutoBadge() {
  return <Badge className="text-[9px] bg-yellow-100 text-yellow-800 border-yellow-300 h-3.5 px-1 ml-1">auto</Badge>;
}

type FProps = { label: string; k: string; f: Record<string,string>; set: (k:string,v:string)=>void; af: Set<string>; type?:string; rows?:number; placeholder?:string; wide?:boolean };

function F({ label, k, f, set, af, type="text", placeholder="" }: FProps) {
  const isAuto = af.has(k);
  return (
    <div>
      <div className="flex items-center mb-1"><Label className="text-xs">{label}</Label>{isAuto && <AutoBadge />}</div>
      {type === "textarea"
        ? <Textarea value={f[k]||""} onChange={e=>set(k,e.target.value)} placeholder={placeholder} rows={3}
            className={cn("text-sm", isAuto && "border-yellow-300 bg-yellow-50/50")} />
        : <Input type={type} value={f[k]||""} onChange={e=>set(k,e.target.value)} placeholder={placeholder}
            className={cn("h-9 text-sm", isAuto && "border-yellow-300 bg-yellow-50/50")} />}
    </div>
  );
}

function Radio({ label, name, opts, k, f, set }: { label:string; name:string; opts:string[]; k:string; f:Record<string,string>; set:(k:string,v:string)=>void }) {
  return (
    <div>
      {label && <Label className="text-xs mb-1.5 block">{label}</Label>}
      <div className="flex flex-wrap gap-3">
        {opts.map(o => (
          <label key={o} className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input type="radio" name={name} value={o} checked={f[k]===o} onChange={()=>set(k,o)} className="h-3.5 w-3.5" />
            {o}
          </label>
        ))}
      </div>
    </div>
  );
}

function Chk({ label, k, f, set }: { label:string; k:string; f:Record<string,string>; set:(k:string,v:string)=>void }) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <Checkbox checked={f[k]==="Y"} onCheckedChange={c=>set(k,c?"Y":"")} />
      {label}
    </label>
  );
}

function G2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>;
}

function G3({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-3 gap-3">{children}</div>;
}

// ── Shared header block (all forms) ──────────────────────────────────────────
function FormHeader({ f, set, af }: { f: Record<string,string>; set:(k:string,v:string)=>void; af: Set<string> }) {
  return (
    <Section title="Form Header">
      <G3>
        <F label="Claim Number" k="claimNumber" f={f} set={set} af={af} />
        <F label="Policy Number" k="policyNumber" f={f} set={set} af={af} />
        <F label="Date of Accident (yyyy/mm/dd)" k="dateOfAccident" f={f} set={set} af={af} type="date" />
      </G3>
    </Section>
  );
}

// ── Shared applicant block (most forms) ──────────────────────────────────────
function ApplicantBlock({ f, set, af, withGender=false, withMiddle=false, withDOA=false }: {
  f: Record<string,string>; set:(k:string,v:string)=>void; af: Set<string>;
  withGender?: boolean; withMiddle?: boolean; withDOA?: boolean;
}) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <F label="Last Name" k="lastName" f={f} set={set} af={af} />
        <F label="First Name" k="firstName" f={f} set={set} af={af} />
        {withMiddle && <F label="Middle Name (optional)" k="middleName" f={f} set={set} af={af} />}
        {withDOA && <F label="Date of Accident (yyyy/mm/dd)" k="dateOfAccident" f={f} set={set} af={af} type="date" />}
      </div>
      <F label="Street Address" k="address" f={f} set={set} af={af} />
      <G3>
        <F label="City/Town" k="city" f={f} set={set} af={af} />
        <F label="Province" k="province" f={f} set={set} af={af} />
        <F label="Postal Code" k="postalCode" f={f} set={set} af={af} />
      </G3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <F label="Date of Birth (yyyy/mm/dd)" k="dateOfBirth" f={f} set={set} af={af} type="date" />
        {withGender && <F label="Gender" k="gender" f={f} set={set} af={af} />}
        <F label="Home Telephone" k="homePhone" f={f} set={set} af={af} />
        <F label="Work Telephone" k="workPhone" f={f} set={set} af={af} />
      </div>
    </>
  );
}

// ── Shared insurance company block ────────────────────────────────────────────
function InsuranceBlock({ f, set, af, withAdjuster=false }: {
  f: Record<string,string>; set:(k:string,v:string)=>void; af: Set<string>; withAdjuster?: boolean;
}) {
  return (
    <Section title="Insurance Company Information">
      <G2>
        <F label="Insurance Company Name" k="insurerName" f={f} set={set} af={af} />
        <F label="City/Town of Branch Office" k="insurerCity" f={f} set={set} af={af} />
      </G2>
      {withAdjuster && (
        <G3>
          <F label="Adjuster Last Name" k="adjusterLast" f={f} set={set} af={af} />
          <F label="Adjuster First Name" k="adjusterFirst" f={f} set={set} af={af} />
          <F label="Adjuster Telephone" k="adjusterPhone" f={f} set={set} af={af} />
          <F label="Extension" k="adjusterExt" f={f} set={set} af={af} />
          <F label="Adjuster Fax" k="adjusterFax" f={f} set={set} af={af} />
        </G3>
      )}
      <G3>
        <F label="Policy Holder Last Name" k="policyHolderLast" f={f} set={set} af={af} />
        <F label="Policy Holder First Name" k="policyHolderFirst" f={f} set={set} af={af} />
        <F label="Policy Number" k="policyNumber" f={f} set={set} af={af} />
      </G3>
    </Section>
  );
}

// ── Shared injury/sequelae block ──────────────────────────────────────────────
function InjuryBlock({ f, set, af, rows=4 }: { f:Record<string,string>; set:(k:string,v:string)=>void; af:Set<string>; rows?:number }) {
  return (
    <Section title="Injury and Sequelae Information">
      <p className="text-xs text-muted-foreground">List most significant first. Include ICD-10-CA code.</p>
      <div className="space-y-2">
        {Array.from({length: rows}, (_,i) => (
          <div key={i} className="grid grid-cols-3 gap-2">
            <div className="col-span-2"><Input value={f[`injuryDesc${i}`]||""} onChange={e=>set(`injuryDesc${i}`,e.target.value)} placeholder={`Injury ${i+1} description`} className="h-9 text-sm" /></div>
            <Input value={f[`injuryCode${i}`]||""} onChange={e=>set(`injuryCode${i}`,e.target.value)} placeholder="ICD-10-CA Code" className="h-9 text-sm" />
          </div>
        ))}
      </div>
    </Section>
  );
}

// ── Shared signature block ────────────────────────────────────────────────────
function SignatureBlock({ title, nameKey, sigKey, dateKey, f, set, af }: {
  title:string; nameKey:string; sigKey:string; dateKey:string;
  f:Record<string,string>; set:(k:string,v:string)=>void; af:Set<string>;
}) {
  return (
    <Section title={title}>
      <G3>
        <F label="Name (please print)" k={nameKey} f={f} set={set} af={af} />
        <F label="Signature (type full name)" k={sigKey} f={f} set={set} af={af} />
        <F label="Date (yyyy/mm/dd)" k={dateKey} f={f} set={set} af={af} type="date" />
      </G3>
    </Section>
  );
}

// ── Shared other insurance block (OCF-18, OCF-23) ────────────────────────────
function OtherInsuranceBlock({ f, set, af }: { f:Record<string,string>; set:(k:string,v:string)=>void; af:Set<string> }) {
  return (
    <Section title="Other Insurance Information">
      <Radio label="Is there other insurance coverage for any goods/services?" name="otherIns" opts={["No","Yes"]} k="otherInsurance" f={f} set={set} />
      <Radio label="Is there Ministry of Health (MOH) coverage?" name="mohCov" opts={["Yes","No","Not applicable"]} k="mohCoverage" f={f} set={set} />
      {["1","2"].map(n => (
        <div key={n} className="border rounded p-3 space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">Other Insurer {n}</Label>
          <G2>
            <F label="Other Insurer Name" k={`otherInsurer${n}Name`} f={f} set={set} af={af} />
            <F label="Insurance Plan/Policy Number" k={`otherInsurer${n}Policy`} f={f} set={set} af={af} />
            <F label="Name of Plan Member" k={`otherInsurer${n}Member`} f={f} set={set} af={af} />
            <F label="Other Insurer's Identifier" k={`otherInsurer${n}Id`} f={f} set={set} af={af} />
          </G2>
        </div>
      ))}
    </Section>
  );
}

// ── Shared health practitioner block ─────────────────────────────────────────
const HP_TYPES_9 = ["Chiropractor","Dentist","Nurse Practitioner","Occupational Therapist","Optometrist","Physician","Physiotherapist","Psychologist","Speech-Language Pathologist"];
const HP_TYPES_12 = [...HP_TYPES_9, "Massage Therapist","Nurse","Social Worker","Other"];
const HP_TYPES_6  = ["Chiropractor","Dentist","Nurse Practitioner","Occupational Therapist","Physician","Physiotherapist"];

function HealthPractBlock({ title, prefix, f, set, af, types=HP_TYPES_9 }: {
  title:string; prefix:string; f:Record<string,string>; set:(k:string,v:string)=>void; af:Set<string>; types?:string[];
}) {
  return (
    <Section title={title}>
      <G2>
        <F label="Name of Health Practitioner" k={`${prefix}Name`} f={f} set={set} af={af} />
        <F label="College Registration Number" k={`${prefix}CollegeReg`} f={f} set={set} af={af} />
        <F label="Facility Name (if applicable)" k={`${prefix}Facility`} f={f} set={set} af={af} />
        <F label="HCAI Facility Registry Number" k={`${prefix}HcaiNo`} f={f} set={set} af={af} />
        <F label="FSRA Licence Number" k={`${prefix}FsraNo`} f={f} set={set} af={af} />
      </G2>
      <F label="Service Address" k={`${prefix}Address`} f={f} set={set} af={af} />
      <G3>
        <F label="City" k={`${prefix}City`} f={f} set={set} af={af} />
        <F label="Province" k={`${prefix}Province`} f={f} set={set} af={af} />
        <F label="Postal Code" k={`${prefix}PostalCode`} f={f} set={set} af={af} />
      </G3>
      <G3>
        <F label="Telephone" k={`${prefix}Phone`} f={f} set={set} af={af} />
        <F label="Extension" k={`${prefix}Ext`} f={f} set={set} af={af} />
        <F label="Fax" k={`${prefix}Fax`} f={f} set={set} af={af} />
        <F label="Email" k={`${prefix}Email`} f={f} set={set} af={af} />
      </G3>
      <div>
        <Label className="text-xs mb-2 block">You are a:</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
          {types.map(t => (
            <Chk key={t} label={t} k={`${prefix}Type_${t}`} f={f} set={set} />
          ))}
        </div>
      </div>
      <G3>
        <F label="Name (please print)" k={`${prefix}SigName`} f={f} set={set} af={af} />
        <F label="Signature" k={`${prefix}Sig`} f={f} set={set} af={af} />
        <F label="Date (yyyy/mm/dd)" k={`${prefix}SigDate`} f={f} set={set} af={af} type="date" />
      </G3>
    </Section>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// FORM DEFINITIONS — each returns JSX for that specific OCF form
// ════════════════════════════════════════════════════════════════════════════════

function OCF1Form({ f, set, af }: { f:Record<string,string>; set:(k:string,v:string)=>void; af:Set<string> }) {
  return (<>
    <FormHeader f={f} set={set} af={af} />
    <Section title="Part 1 — Applicant Information">
      <G2>
        <F label="First Name" k="firstName" f={f} set={set} af={af} />
        <F label="Last Name" k="lastName" f={f} set={set} af={af} />
        <F label="Date of Birth" k="dateOfBirth" f={f} set={set} af={af} type="date" />
        <F label="Driver's Licence Number" k="driverLicence" f={f} set={set} af={af} />
      </G2>
      <F label="Street Address" k="address" f={f} set={set} af={af} />
      <G3><F label="City" k="city" f={f} set={set} af={af} /><F label="Province" k="province" f={f} set={set} af={af} /><F label="Postal Code" k="postalCode" f={f} set={set} af={af} /></G3>
      <G3><F label="Phone Number" k="phone" f={f} set={set} af={af} /><F label="Email" k="email" f={f} set={set} af={af} /><F label="Gender" k="gender" f={f} set={set} af={af} /></G3>
      <F label="Languages Used" k="languages" f={f} set={set} af={af} />
      <Radio label="Marital Status" name="marital" opts={["Separated","Common-Law","Married","Single","Divorced","Widow(er)"]} k="maritalStatus" f={f} set={set} />
      <Radio label="Consent to electronic communication?" name="eConsent" opts={["Yes","No"]} k="electronicConsent" f={f} set={set} />
    </Section>
    <Section title="Part 2 — Policy Details">
      <div><Label className="text-xs mb-2 block">Relationship to Policyholder (select all that apply)</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {["I am the Policyholder","Spouse of Policyholder","Listed Driver","Employee of the Policyholder","Vehicle rented/leased 30+ days","Dependent of the Policyholder/spouse","No relationship to the Policyholder"].map(r => <Chk key={r} label={r} k={`rel_${r}`} f={f} set={set} />)}
        </div>
      </div>
      <Radio label="Aware of other auto insurance coverage?" name="otherCov" opts={["Yes","No","I don't know"]} k="otherCoverage" f={f} set={set} />
      {f.otherCoverage==="Yes" && <F label="List insurer(s) and policy number(s)" k="otherCoverageDetails" f={f} set={set} af={af} type="textarea" />}
      <div><Label className="text-xs mb-2 block">How were you involved in the accident? (select all that apply)</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {["Driver of Vehicle Insured under this Policy","Passenger of Vehicle Insured under this Policy","Pedestrian or Cyclist","Driver/Passenger of vehicle NOT insured under this Policy"].map(r => <Chk key={r} label={r} k={`inv_${r}`} f={f} set={set} />)}
        </div>
        <div className="mt-2"><F label="Other involvement — details" k="invOtherDetails" f={f} set={set} af={af} /></div>
      </div>
    </Section>
    <Section title="Part 3 — Accident Details">
      <F label="Location of Accident (Intersection, City, Province/State)" k="accidentLocation" f={f} set={set} af={af} />
      <G2>
        <F label="Date of Accident" k="dateOfAccident" f={f} set={set} af={af} type="date" />
        <F label="Time of Accident" k="timeOfAccident" f={f} set={set} af={af} type="time" />
      </G2>
      <F label="Brief description of accident and all injuries sustained" k="accidentDescription" f={f} set={set} af={af} type="textarea" />
      <div><Label className="text-xs mb-2 block">Select all that apply</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {["Went to collision reporting centre","Police attended","Ambulance attended","Went to the hospital","Went to doctor/nurse practitioner/other Regulated Healthcare Provider"].map(r => <Chk key={r} label={r} k={`resp_${r}`} f={f} set={set} />)}
        </div>
      </div>
      <G3>
        <Radio label="Were you charged?" name="charged" opts={["Yes","No"]} k="wereYouCharged" f={f} set={set} />
        {f.wereYouCharged==="Yes" && <F label="List charge" k="chargeDetails" f={f} set={set} af={af} />}
        <Radio label="Accident happen while working?" name="atWork" opts={["Yes","No"]} k="accidentAtWork" f={f} set={set} />
        <Radio label="Accident while travelling to/from work?" name="commute" opts={["Yes","No"]} k="accidentCommute" f={f} set={set} />
      </G3>
    </Section>
    <Section title="Part 4 — Applicant Status at Time of Accident">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {["Working Full-Time","Working Part-Time","Self-Employed","Unemployed","Receiving Employment Insurance","Retired","Student","Caregiver","Worked 26 weeks in past 52 weeks","Receiving WSIB Benefits"].map(s => <Chk key={s} label={s} k={`status_${s}`} f={f} set={set} />)}
      </div>
      {[["missedActivities","returnedActivities","Missed time from pre-accident activities"],["missedWork","returnedWork","Missed time from work"],["missedSchool","returnedSchool","Missed time from school"]].map(([k,dk,lbl]) => (
        <div key={k} className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
          <Radio label={lbl} name={k} opts={["Yes","No","N/A"]} k={k} f={f} set={set} />
          {f[k]==="Yes" && <F label="Date returned (yyyy/mm/dd)" k={dk} f={f} set={set} af={af} type="date" />}
        </div>
      ))}
    </Section>
    <Section title="Part 5 — Other Insurance">
      <Radio label="Do you have any other benefit plan that covers you?" name="otherBen" opts={["Yes","No"]} k="hasOtherBenefits" f={f} set={set} />
      {f.hasOtherBenefits==="Yes" && <>
        <F label="Name of benefit companies and policy number(s)" k="otherBenefitDetails" f={f} set={set} af={af} type="textarea" />
        <div><Label className="text-xs mb-2 block">Type of Coverage</Label>
          <div className="flex flex-wrap gap-3">{["Medical","Dental","Short Term Disability","Long Term Disability","Other"].map(t => <Chk key={t} label={t} k={`cov_${t}`} f={f} set={set} />)}</div>
        </div>
      </>}
    </Section>
    <Section title="Part 6 — Authorization for Direct Payment to Service Provider">
      <p className="text-xs text-muted-foreground">I direct the insurer, including the Motor Vehicle Accident Claims Fund, to pay the licensed service provider directly for that portion of the approved goods and services specified in separate forms OCF-23 and OCF-18, that are not covered by extended/supplementary health insurance.</p>
      <div className="max-w-xs"><F label="Initials of Applicant or Substitute Decision Maker" k="part6Initials" f={f} set={set} af={af} /></div>
    </Section>
    <SignatureBlock title="Part 7 — Signatures & Certification" nameKey="sigName" sigKey="signature" dateKey="dateSigned" f={f} set={set} af={af} />
  </>);
}

function OCF2Form({ f, set, af }: { f:Record<string,string>; set:(k:string,v:string)=>void; af:Set<string> }) {
  return (<>
    <FormHeader f={f} set={set} af={af} />
    <Section title="Part 1 — Applicant Information">
      <ApplicantBlock f={f} set={set} af={af} withGender />
      <div className="mt-3 space-y-2 border-t pt-3">
        <Label className="text-xs font-medium">Insurance Company</Label>
        <G2><F label="Insurance Company Name" k="insurerName" f={f} set={set} af={af} /></G2>
        <F label="Street Address" k="insurerAddress" f={f} set={set} af={af} />
        <G3><F label="City" k="insurerCity" f={f} set={set} af={af} /><F label="Province" k="insurerProvince" f={f} set={set} af={af} /><F label="Postal Code" k="insurerPostalCode" f={f} set={set} af={af} /></G3>
        <G2><F label="Name of Policyholder" k="policyHolderName" f={f} set={set} af={af} /><F label="Policy Number" k="policyNumber" f={f} set={set} af={af} /></G2>
      </div>
    </Section>
    <SignatureBlock title="Part 2 — Authorization" nameKey="sigName" sigKey="signature" dateKey="dateSigned" f={f} set={set} af={af} />
    <Section title="Part 3 — Salary Period Required">
      <div><Label className="text-xs mb-2 block">Employed — period to use:</Label>
        <div className="flex gap-4"><Chk label="4 weeks before accident" k="period4Wks" f={f} set={set} /><Chk label="52 weeks before accident" k="period52Wks" f={f} set={set} /></div>
      </div>
      <div className="border-t pt-3"><Label className="text-xs mb-2 block">Self-Employed — designate period:</Label>
        <div className="flex gap-4 mb-2"><Chk label="52 weeks" k="selfEmp52Wks" f={f} set={set} /><Chk label="Last complete fiscal year" k="selfEmpFiscal" f={f} set={set} /></div>
        <G2><F label="From (yyyy/mm/dd)" k="selfEmpFrom" f={f} set={set} af={af} type="date" /><F label="To (yyyy/mm/dd)" k="selfEmpTo" f={f} set={set} af={af} type="date" /></G2>
      </div>
    </Section>
    <Section title="Part 4 — Applicant's Income (completed by employer)">
      <div className="grid grid-cols-5 gap-2">
        {["Week 1","Week 2","Week 3","Week 4"].map(w => <F key={w} label={w} k={`gross${w.replace(" ","")}`} f={f} set={set} af={af} />)}
        <F label="Number of Weeks Worked" k="weeksWorked" f={f} set={set} af={af} />
      </div>
      <G3>
        <F label="Gross Income Last 4 Weeks" k="grossLast4Wks" f={f} set={set} af={af} />
        <F label="Gross Income Last 52 Weeks" k="grossLast52Wks" f={f} set={set} af={af} />
        <F label="Self-Employed Gross Income" k="selfEmpGross" f={f} set={set} af={af} />
        <F label="Salary" k="salary" f={f} set={set} af={af} />
        <F label="Tips / Commissions" k="tips" f={f} set={set} af={af} />
        <F label="Other Monetary Compensation" k="otherComp" f={f} set={set} af={af} />
        <F label="Total" k="incomeTotal" f={f} set={set} af={af} />
      </G3>
      <Radio label="Was the applicant absent from work during this period?" name="absent" opts={["Yes","No"]} k="absentFromWork" f={f} set={set} />
      {f.absentFromWork==="Yes" && <F label="Explain" k="absentExplain" f={f} set={set} af={af} type="textarea" />}
      <Radio label="Any other types of compensation available from the employer?" name="otherCompAvail" opts={["Yes","No"]} k="otherCompAvailable" f={f} set={set} />
      {f.otherCompAvailable==="Yes" && <F label="Explain" k="otherCompExplain" f={f} set={set} af={af} type="textarea" />}
    </Section>
    <Section title="Part 5 — Other Benefits">
      {[["incomeContinuation","Income Continuation Benefit (short/long-term disability)"],["suppMedical","Supplementary Medical/Rehabilitation/Attendant Care Benefits"],["sickLeave","Sick Leave"]].map(([k,lbl]) => (
        <div key={k} className="space-y-2">
          <Radio label={lbl} name={k} opts={["Yes","No"]} k={k} f={f} set={set} />
          {f[k]==="Yes" && <G2><F label="Insurance Company" k={`${k}Insurer`} f={f} set={set} af={af} /><F label="Policy Number" k={`${k}Policy`} f={f} set={set} af={af} /></G2>}
          {k==="sickLeave" && f[k]==="Yes" && <Radio label="Did applicant use sick credits after accident?" name="usedSickCredits" opts={["Yes","No"]} k="usedSickCredits" f={f} set={set} />}
        </div>
      ))}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Radio label="Member of a union?" name="union" opts={["Yes","No"]} k="unionMember" f={f} set={set} />
        <Radio label="Contributes to CPP or similar?" name="cpp" opts={["Yes","No"]} k="cppContributor" f={f} set={set} />
        <Radio label="WSIB claim filed for this accident?" name="wsib" opts={["Yes","No"]} k="wsibClaim" f={f} set={set} />
      </div>
    </Section>
    <Section title="Part 6 — Employment Details">
      <G3>
        <F label="Employment From (yyyy/mm/dd)" k="employedFrom" f={f} set={set} af={af} type="date" />
        <F label="Employment To (yyyy/mm/dd)" k="employedTo" f={f} set={set} af={af} type="date" />
        <F label="Latest Job Title" k="jobTitle" f={f} set={set} af={af} />
        <F label="Last Date Worked (yyyy/mm/dd)" k="lastDateWorked" f={f} set={set} af={af} type="date" />
        <F label="Date of Return to Work (yyyy/mm/dd)" k="returnToWork" f={f} set={set} af={af} type="date" />
      </G3>
      <F label="Brief Job Description" k="jobDescription" f={f} set={set} af={af} type="textarea" />
      <F label="Essential Tasks of Job" k="essentialTasks" f={f} set={set} af={af} type="textarea" />
      <div><Label className="text-xs mb-2 block">Type of Employment</Label>
        <div className="flex flex-wrap gap-4">{["Full-time","Part-time","Casual","Seasonal"].map(t => <Chk key={t} label={t} k={`empType_${t}`} f={f} set={set} />)}</div>
      </div>
    </Section>
    <Section title="Part 7 — Employer Information">
      <G2>
        <F label="Company Name" k="employerCompany" f={f} set={set} af={af} />
        <F label="Contact Person" k="employerContact" f={f} set={set} af={af} />
        <F label="Address" k="employerAddress" f={f} set={set} af={af} />
        <F label="Tax Reg # / Business Identification Number (BIN)" k="employerBIN" f={f} set={set} af={af} />
        <F label="City/Town" k="employerCity" f={f} set={set} af={af} />
        <F label="Province" k="employerProvince" f={f} set={set} af={af} />
        <F label="Postal Code" k="employerPC" f={f} set={set} af={af} />
        <F label="Telephone" k="employerPhone" f={f} set={set} af={af} />
        <F label="Fax" k="employerFax" f={f} set={set} af={af} />
      </G2>
    </Section>
    <SignatureBlock title="Part 8 — Employer Signature" nameKey="empSigName" sigKey="empSig" dateKey="empSigDate" f={f} set={set} af={af} />
  </>);
}

function OCF3Form({ f, set, af }: { f:Record<string,string>; set:(k:string,v:string)=>void; af:Set<string> }) {
  return (<>
    <FormHeader f={f} set={set} af={af} />
    <Section title="Part 1 — Applicant Information (completed by applicant)">
      <ApplicantBlock f={f} set={set} af={af} withGender withMiddle />
      <F label="Email (optional)" k="email" f={f} set={set} af={af} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Radio label="Currently working?" name="currWork" opts={["Yes","No"]} k="currentlyWorking" f={f} set={set} />
        {f.currentlyWorking==="No" && <F label="Last date worked (yyyy/mm/dd)" k="lastDateWorked" f={f} set={set} af={af} type="date" />}
        <Radio label="Working at time of accident?" name="workAtAccident" opts={["Yes","No"]} k="workingAtAccident" f={f} set={set} />
        {f.workingAtAccident==="Yes" && <F label="Type of work" k="typeOfWork" f={f} set={set} af={af} />}
        <Radio label="Worked 26 of past 52 weeks or receiving EI?" name="26wks" opts={["Yes","No"]} k="worked26Weeks" f={f} set={set} />
        <Radio label="Receiving Employment Insurance at time of accident?" name="eiAtAccident" opts={["Yes","No"]} k="receivingEI" f={f} set={set} />
        <Radio label="Primary caregiver for someone you lived with?" name="caregiver" opts={["Yes","No"]} k="primaryCaregiver" f={f} set={set} />
        <Radio label="Enrolled in an education program at time of accident?" name="education" opts={["Yes","No"]} k="enrolledEducation" f={f} set={set} />
      </div>
    </Section>
    <InsuranceBlock f={f} set={set} af={af} />
    <Section title="Part 3 — Accident Description (completed by applicant)">
      <F label="Give a brief description of the accident and all injuries sustained" k="accidentDescription" f={f} set={set} af={af} type="textarea" rows={5} />
    </Section>
    <SignatureBlock title="Part 4 — Applicant Signature" nameKey="sigName" sigKey="signature" dateKey="dateSigned" f={f} set={set} af={af} />
    <InjuryBlock f={f} set={set} af={af} />
    <Section title="Part 6 — Disability Tests (completed by health practitioner)">
      <G3>
        <F label="Date symptoms first appeared" k="symptomsDate" f={f} set={set} af={af} type="date" />
        <F label="Date of most recent examination" k="mostRecentExamDate" f={f} set={set} af={af} type="date" />
        <F label="Date of first post-accident examination" k="firstPostExamDate" f={f} set={set} af={af} type="date" />
      </G3>
      {[
        ["unableEssentialTasks","Unable to perform essential tasks of employment?","Y/N/NA",true],
        ["modifiedWork","Return to work on modified hours/duties?","Y/N/NA",true],
        ["inabilityNormalLife","Complete inability to carry on a normal life?","Y/N",false],
        ["caregiverInability","Primary caregiver substantial inability?","Y/N",false],
        ["unableEducation","Unable to continue in education program?","Y/N",false],
        ["houseKeepingInability","Substantial inability to perform housekeeping?","Y/N",false],
      ].map(([k,lbl,opts,hasNA]) => (
        <div key={k as string}>
          <Radio label={lbl as string} name={k as string} opts={(opts==="Y/N/NA"?["Yes","No","N/A"]:["Yes","No"])} k={k as string} f={f} set={set} />
          {(f[k as string]==="Yes" || f[k as string]==="No") && <F label="If yes, explain" k={`${k}Explain`} f={f} set={set} af={af} type="textarea" />}
        </div>
      ))}
      <div><Label className="text-xs mb-2 block">Anticipated Duration</Label>
        <div className="flex flex-wrap gap-3">{["1-4 weeks","5-8 weeks","9-12 weeks","more than 12 weeks"].map(d => <Chk key={d} label={d} k={`duration_${d}`} f={f} set={set} />)}</div>
        {f["duration_more than 12 weeks"]==="Y" && <F label="Explain why limitations will persist beyond 12 weeks" k="duration12PlusExplain" f={f} set={set} af={af} type="textarea" />}
      </div>
    </Section>
    <Section title="Part 7 — Further Investigations (health practitioner)">
      <Radio label="Prior examinations, investigations, or consultations not previously reported?" name="priorExams" opts={["Yes","No"]} k="priorExams" f={f} set={set} />
      {f.priorExams==="Yes" && <F label="Specify findings and results" k="priorExamsDetails" f={f} set={set} af={af} type="textarea" />}
      <Radio label="Further examinations, investigations or consultations required?" name="furtherExams" opts={["Yes","No"]} k="furtherExams" f={f} set={set} />
      {f.furtherExams==="Yes" && <F label="Specify" k="furtherExamsDetails" f={f} set={set} af={af} type="textarea" />}
    </Section>
    <Section title="Part 8 — Prior and Concurrent Conditions (health practitioner)">
      <Radio label="Prior disease, condition or injury affecting ability to perform Part 6 activities?" name="priorCondition" opts={["Yes","No","Unknown"]} k="priorCondition" f={f} set={set} />
      {f.priorCondition==="Yes" && <>
        <F label="Explain" k="priorConditionExplain" f={f} set={set} af={af} type="textarea" />
        <Radio label="Currently receiving disability benefits for pre-existing condition?" name="priorBenefits" opts={["Yes","No","Unknown"]} k="priorBenefits" f={f} set={set} />
        {f.priorBenefits==="Yes" && <F label="Explain" k="priorBenefitsExplain" f={f} set={set} af={af} type="textarea" />}
        <F label="Prior treatment for similar conditions (date of onset, interventions, status at time of accident)" k="priorTreatmentDesc" f={f} set={set} af={af} type="textarea" />
      </>}
      <Radio label="Since the accident, any other disease/condition not related to accident?" name="postCondition" opts={["Yes","No","Unknown"]} k="postAccidentCondition" f={f} set={set} />
      {f.postAccidentCondition==="Yes" && <F label="Explain" k="postAccidentConditionExplain" f={f} set={set} af={af} type="textarea" />}
    </Section>
    <Section title="Part 9 — Medications (health practitioner)">
      <F label="Accident-related medications (name, dosage, frequency)" k="accidentMeds" f={f} set={set} af={af} type="textarea" />
      <Radio label="Were these prescribed by you?" name="accidentMedsPrescribed" opts={["Yes","No"]} k="accidentMedsPrescribed" f={f} set={set} />
      <F label="Prior/concurrent medications (name, dosage, frequency)" k="priorMeds" f={f} set={set} af={af} type="textarea" />
      <Radio label="Were these prescribed by you?" name="priorMedsPrescribed" opts={["Yes","No"]} k="priorMedsPrescribed" f={f} set={set} />
    </Section>
    <HealthPractBlock title="Part 10 — Health Practitioner Signature" prefix="hp" f={f} set={set} af={af} types={HP_TYPES_9} />
  </>);
}

function OCF4Form({ f, set, af }: { f:Record<string,string>; set:(k:string,v:string)=>void; af:Set<string> }) {
  return (<>
    <FormHeader f={f} set={set} af={af} />
    <Section title="Part 1 — Deceased's Information">
      <G2><F label="Deceased's Last Name" k="decLastName" f={f} set={set} af={af} /><F label="Deceased's First Name and Initial" k="decFirstName" f={f} set={set} af={af} /></G2>
      <F label="Address" k="decAddress" f={f} set={set} af={af} />
      <G3><F label="City/Town" k="decCity" f={f} set={set} af={af} /><F label="Province" k="decProvince" f={f} set={set} af={af} /><F label="Postal Code" k="decPostalCode" f={f} set={set} af={af} /></G3>
      <G3><F label="Birth Date (yyyy/mm/dd)" k="decDOB" f={f} set={set} af={af} type="date" /><F label="Date of Accident (yyyy/mm/dd)" k="dateOfAccident" f={f} set={set} af={af} type="date" /><F label="Date of Death (yyyy/mm/dd)" k="dateOfDeath" f={f} set={set} af={af} type="date" /></G3>
      <Radio label="Marital Status" name="decMarital" opts={["Single","Married","Common-Law","Separated","Divorced","Widow(er)"]} k="decMaritalStatus" f={f} set={set} />
      <G2>
        <Radio label="Dependants at time of death?" name="decDependants" opts={["No","Yes"]} k="decHadDependants" f={f} set={set} />
        {f.decHadDependants==="Yes" && <F label="How many persons?" k="decDependantsCount" f={f} set={set} af={af} />}
        <Radio label="Death Certificate attached?" name="deathCert" opts={["No","Yes"]} k="deathCertAttached" f={f} set={set} />
      </G2>
    </Section>
    <Section title="Part 2 — Survivor Information (up to 3 applicants)">
      {[1,2,3].map(n => (
        <div key={n} className="border rounded p-3 space-y-2">
          <Label className="text-xs font-semibold">Applicant {n}</Label>
          <G2><F label="Last Name" k={`surv${n}Last`} f={f} set={set} af={af} /><F label="First Name and Initial" k={`surv${n}First`} f={f} set={set} af={af} /></G2>
          <F label="Address" k={`surv${n}Address`} f={f} set={set} af={af} />
          <G3><F label="City/Town" k={`surv${n}City`} f={f} set={set} af={af} /><F label="Province" k={`surv${n}Province`} f={f} set={set} af={af} /><F label="Postal Code" k={`surv${n}PC`} f={f} set={set} af={af} /></G3>
          <G3><F label="Home Telephone" k={`surv${n}HomePhone`} f={f} set={set} af={af} /><F label="Work Telephone" k={`surv${n}WorkPhone`} f={f} set={set} af={af} /><F label="Fax" k={`surv${n}Fax`} f={f} set={set} af={af} /></G3>
          <div><Label className="text-xs mb-2 block">Relationship to Deceased</Label>
            <div className="flex flex-wrap gap-3">{["Spouse","Parent","Guardian","Dependant","Former spouse entitled to support","Other"].map(r => <Chk key={r} label={r} k={`surv${n}Rel_${r}`} f={f} set={set} />)}</div>
          </div>
        </div>
      ))}
    </Section>
    <Section title="Part 3 — Funeral Expenses (attach all original receipts)">
      <p className="text-xs text-muted-foreground mb-2">Attach all bills and receipts. Explain any missing receipts below.</p>
      {[0,1,2,3,4].map(i => (
        <div key={i} className="grid grid-cols-7 gap-2 items-center">
          <div className="col-span-2"><F label={i===0?"Date (yyyy/mm/dd)":""} k={`funeralDate${i}`} f={f} set={set} af={af} type="date" /></div>
          <div className="col-span-4"><F label={i===0?"Description of Service and Name of Supplier":""} k={`funeralDesc${i}`} f={f} set={set} af={af} /></div>
          <div><F label={i===0?"Amount":""} k={`funeralAmt${i}`} f={f} set={set} af={af} /></div>
        </div>
      ))}
      <F label="Total Payment Requested" k="funeralTotal" f={f} set={set} af={af} />
      <F label="Details of missing bills or receipts" k="missingBillsDetails" f={f} set={set} af={af} type="textarea" />
    </Section>
    {[1,2,3].map(n => (
      <SignatureBlock key={n} title={`Part 4 — Applicant ${n} Signature`} nameKey={`surv${n}SigName`} sigKey={`surv${n}Sig`} dateKey={`surv${n}SigDate`} f={f} set={set} af={af} />
    ))}
  </>);
}

function OCF5Form({ f, set, af }: { f:Record<string,string>; set:(k:string,v:string)=>void; af:Set<string> }) {
  return (<>
    <FormHeader f={f} set={set} af={af} />
    <Section title="Part 1 — Applicant Information">
      <G2>
        <F label="Last Name" k="lastName" f={f} set={set} af={af} />
        <F label="First Name and Initial" k="firstName" f={f} set={set} af={af} />
        <F label="Date of Accident (yyyy/mm/dd)" k="dateOfAccident" f={f} set={set} af={af} type="date" />
      </G2>
      <F label="Street Address" k="address" f={f} set={set} af={af} />
      <G3><F label="City/Town" k="city" f={f} set={set} af={af} /><F label="Province" k="province" f={f} set={set} af={af} /><F label="Postal Code" k="postalCode" f={f} set={set} af={af} /></G3>
      <G3><F label="Date of Birth (yyyy/mm/dd)" k="dateOfBirth" f={f} set={set} af={af} type="date" /><F label="Home Telephone" k="homePhone" f={f} set={set} af={af} /><F label="Work Telephone" k="workPhone" f={f} set={set} af={af} /><F label="Extension" k="extension" f={f} set={set} af={af} /></G3>
    </Section>
    <InsuranceBlock f={f} set={set} af={af} />
    <Section title="Part 3 — Treating Health Professional">
      <G2><F label="Name of Health Professional" k="hpName" f={f} set={set} af={af} /><F label="Health Profession" k="hpProfession" f={f} set={set} af={af} /></G2>
      <F label="Street Address" k="hpAddress" f={f} set={set} af={af} />
      <G3><F label="City/Town" k="hpCity" f={f} set={set} af={af} /><F label="Province" k="hpProvince" f={f} set={set} af={af} /><F label="Postal Code" k="hpPostalCode" f={f} set={set} af={af} /></G3>
      <G2><F label="Telephone" k="hpPhone" f={f} set={set} af={af} /><F label="Fax" k="hpFax" f={f} set={set} af={af} /></G2>
    </Section>
    <SignatureBlock title="Part 4 — Applicant Signature" nameKey="sigName" sigKey="signature" dateKey="dateSigned" f={f} set={set} af={af} />
  </>);
}

function OCF6Form({ f, set, af, expenses, setExpenses }: {
  f:Record<string,string>; set:(k:string,v:string)=>void; af:Set<string>;
  expenses: {date:string;desc:string;amount:string}[]; setExpenses: (e:any)=>void;
}) {
  const total = expenses.reduce((s,e) => s+(parseFloat(e.amount)||0), 0).toFixed(2);
  return (<>
    <FormHeader f={f} set={set} af={af} />
    <Section title="Part 1 — Applicant Information">
      <G3><F label="Last Name" k="lastName" f={f} set={set} af={af} /><F label="First Name and Initial" k="firstName" f={f} set={set} af={af} /><F label="Gender" k="gender" f={f} set={set} af={af} /></G3>
      <F label="Street Address" k="address" f={f} set={set} af={af} />
      <G3><F label="City/Town" k="city" f={f} set={set} af={af} /><F label="Province" k="province" f={f} set={set} af={af} /><F label="Postal Code" k="postalCode" f={f} set={set} af={af} /></G3>
      <G3><F label="Date of Birth (yyyy/mm/dd)" k="dateOfBirth" f={f} set={set} af={af} type="date" /><F label="Home Telephone" k="homePhone" f={f} set={set} af={af} /><F label="Work Telephone" k="workPhone" f={f} set={set} af={af} /></G3>
    </Section>
    <Section title="Part 2 — Expenses (attach all bills and receipts)">
      <p className="text-xs text-muted-foreground">Eligible expenses include: medical/rehab treatment, attendant care, lost educational expenses, caregivers, home maintenance, housekeeping, transportation, visitors, clothing/dentures/glasses/prostheses repair.</p>
      <div className="space-y-2">
        <div className="grid grid-cols-8 gap-2 text-xs font-medium text-muted-foreground">
          <span className="col-span-1">Item #</span><span className="col-span-2">Date</span><span className="col-span-4">Description & Service Provider</span><span className="col-span-1">Amount</span>
        </div>
        {expenses.map((e,i) => (
          <div key={i} className="grid grid-cols-8 gap-2 items-center">
            <span className="col-span-1 text-xs text-center text-muted-foreground">{i+1}</span>
            <div className="col-span-2"><Input type="date" value={e.date} onChange={ev=>setExpenses(expenses.map((x,j)=>j===i?{...x,date:ev.target.value}:x))} className="h-8 text-xs" /></div>
            <div className="col-span-4"><Input value={e.desc} onChange={ev=>setExpenses(expenses.map((x,j)=>j===i?{...x,desc:ev.target.value}:x))} placeholder="Description and service provider" className="h-8 text-xs" /></div>
            <div className="col-span-1 flex gap-1">
              <Input value={e.amount} onChange={ev=>setExpenses(expenses.map((x,j)=>j===i?{...x,amount:ev.target.value}:x))} placeholder="$" className="h-8 text-xs" />
              {expenses.length>1 && <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={()=>setExpenses(expenses.filter((_,j)=>j!==i))}><Trash2 className="h-3 w-3" /></Button>}
            </div>
          </div>
        ))}
        <Button type="button" size="sm" variant="outline" onClick={()=>setExpenses([...expenses,{date:"",desc:"",amount:""}])}><Plus className="h-3.5 w-3.5 mr-1" />Add Expense</Button>
        <div className="text-right text-sm font-semibold">Total Amount: ${total}</div>
      </div>
    </Section>
    <SignatureBlock title="Part 3 — Signature" nameKey="sigName" sigKey="signature" dateKey="dateSigned" f={f} set={set} af={af} />
  </>);
}

function OCF10Form({ f, set, af }: { f:Record<string,string>; set:(k:string,v:string)=>void; af:Set<string> }) {
  return (<>
    <FormHeader f={f} set={set} af={af} />
    <Section title="Part 1 — Applicant Information">
      <G3><F label="Last Name" k="lastName" f={f} set={set} af={af} /><F label="First Name and Initial" k="firstName" f={f} set={set} af={af} /><F label="Gender" k="gender" f={f} set={set} af={af} /></G3>
      <F label="Street Address" k="address" f={f} set={set} af={af} />
      <G3><F label="City/Town" k="city" f={f} set={set} af={af} /><F label="Province" k="province" f={f} set={set} af={af} /><F label="Postal Code" k="postalCode" f={f} set={set} af={af} /></G3>
      <G3><F label="Date of Birth (yyyy/mm/dd)" k="dateOfBirth" f={f} set={set} af={af} type="date" /><F label="Home Telephone" k="homePhone" f={f} set={set} af={af} /><F label="Work Telephone" k="workPhone" f={f} set={set} af={af} /></G3>
    </Section>
    <Section title="Part 2 — Benefit Election">
      <p className="text-xs text-muted-foreground mb-3">Although you may be eligible for more than one of these benefits, you can only receive one. <strong>Your choice cannot be changed after submission unless the injury is determined to be catastrophic.</strong></p>
      <div className="space-y-3">
        {["Income Replacement Benefit","Non-Earner Benefit","Caregiver Benefit"].map(b => (
          <label key={b} className="flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
            <input type="radio" name="benefitElection" value={b} checked={f.benefitElection===b} onChange={()=>set("benefitElection",b)} className="h-4 w-4" />
            <div><p className="text-sm font-medium">{b}</p></div>
          </label>
        ))}
      </div>
    </Section>
    <SignatureBlock title="Part 3 — Signature" nameKey="sigName" sigKey="signature" dateKey="dateSigned" f={f} set={set} af={af} />
  </>);
}

function OCF18Form({ f, set, af }: { f:Record<string,string>; set:(k:string,v:string)=>void; af:Set<string> }) {
  const [providers, setProviders] = useState(Array.from({length:6},(_,i)=>({ref:String.fromCharCode(65+i),type:"",last:"",first:"",regNo:"",hourlyRate:""})));
  const [goods, setGoods] = useState(Array.from({length:13},()=>({desc:"",code:"",attrib:"",provRef:"",qty:"",measure:"",cost:"",totalCount:"",totalCost:""})));
  return (<>
    <FormHeader f={f} set={set} af={af} />
    <Section title="Part 1 — Applicant Information">
      <G3><F label="Date of Birth" k="dateOfBirth" f={f} set={set} af={af} type="date" /><F label="Gender" k="gender" f={f} set={set} af={af} /><F label="Telephone" k="phone" f={f} set={set} af={af} /><F label="Extension" k="extension" f={f} set={set} af={af} /></G3>
      <G3><F label="Last Name" k="lastName" f={f} set={set} af={af} /><F label="First Name" k="firstName" f={f} set={set} af={af} /><F label="Middle Name (optional)" k="middleName" f={f} set={set} af={af} /></G3>
      <F label="Address" k="address" f={f} set={set} af={af} />
      <G3><F label="City" k="city" f={f} set={set} af={af} /><F label="Province" k="province" f={f} set={set} af={af} /><F label="Postal Code" k="postalCode" f={f} set={set} af={af} /></G3>
    </Section>
    <InsuranceBlock f={f} set={set} af={af} withAdjuster />
    <OtherInsuranceBlock f={f} set={set} af={af} />
    <HealthPractBlock title="Part 4 — Health Practitioner Signature" prefix="hp4" f={f} set={set} af={af} types={HP_TYPES_9} />
    <Section title="Part 4 — Minor Injury (For accidents on/after September 1, 2010)">
      <Radio label="Is this impairment predominantly a minor injury?" name="minorInjury" opts={["Yes","No"]} k="minorInjury" f={f} set={set} />
      {f.minorInjury==="Yes" && (
        <div className="space-y-2">
          <Chk label="Treatment under the Minor Injury Guideline has already been provided and additional treatment is required within the $3,500 limit" k="migAdditional" f={f} set={set} />
          <Chk label="Applicant has a pre-existing condition that will prevent maximal recovery from the minor injury if subject to the $3,500 limit" k="migPreExisting" f={f} set={set} />
          {f.migPreExisting==="Y" && <F label="Provide explanation and compelling evidence" k="migPreExistingExplain" f={f} set={set} af={af} type="textarea" />}
        </div>
      )}
    </Section>
    <HealthPractBlock title="Part 5 — Regulated Health Professional Signature (if different from Part 4)" prefix="hp5" f={f} set={set} af={af} types={HP_TYPES_12} />
    <InjuryBlock f={f} set={set} af={af} rows={4} />
    <Section title="Part 7 — Prior and Concurrent Conditions">
      <Radio label="a) Prior disease/condition/injury affecting response to treatment?" name="prior7a" opts={["No","Unknown","Yes"]} k="prior7a" f={f} set={set} />
      {f.prior7a==="Yes" && <>
        <F label="Explain" k="prior7aExplain" f={f} set={set} af={af} type="textarea" />
        <Radio label="Did applicant undergo investigation/treatment in the past year?" name="prior7aTx" opts={["No","Unknown","Yes"]} k="prior7aTreatment" f={f} set={set} />
        {f.prior7aTreatment==="Yes" && <F label="Explain and identify provider" k="prior7aTreatmentExplain" f={f} set={set} af={af} type="textarea" />}
      </>}
      <Radio label="b) Since accident, other disease/condition not related to accident?" name="prior7b" opts={["No","Unknown","Yes"]} k="prior7b" f={f} set={set} />
      {f.prior7b==="Yes" && <F label="Explain" k="prior7bExplain" f={f} set={set} af={af} type="textarea" />}
    </Section>
    <Section title="Part 8 — Activity Limitations">
      <Radio label="Employment tasks" name="actEmp" opts={["Not employed","No","Unknown","Yes"]} k="actEmployment" f={f} set={set} />
      <Radio label="Activities of normal life" name="actNormal" opts={["No","Unknown","Yes"]} k="actNormalLife" f={f} set={set} />
      {(f.actEmployment==="Yes"||f.actNormalLife==="Yes") && <F label="Describe activities limited and their impact" k="actLimitedDesc" f={f} set={set} af={af} type="textarea" />}
      <Radio label="Can employer provide modified employment?" name="modifiedEmp" opts={["Not employed","Yes","Unknown","No"]} k="modifiedEmployment" f={f} set={set} />
      {f.modifiedEmployment==="No" && <F label="Explain" k="modifiedEmploymentExplain" f={f} set={set} af={af} type="textarea" />}
    </Section>
    <Section title="Part 9 — Plan Goals, Evaluation and Barriers">
      <div><Label className="text-xs mb-2 block">Goals (i) — Impairment goals:</Label>
        <div className="flex flex-wrap gap-3">{["Pain reduction","Increased range of motion","Increase in strength","Other/not applicable"].map(g => <Chk key={g} label={g} k={`goal1_${g}`} f={f} set={set} />)}</div>
        {f["goal1_Other/not applicable"]==="Y" && <F label="Specify other goals" k="goal1OtherSpec" f={f} set={set} af={af} />}
      </div>
      <div><Label className="text-xs mb-2 block">Goals (ii) — Functional goals:</Label>
        <div className="flex flex-wrap gap-3">{["Return to activities of normal living","Return to pre-accident work activities","Return to modified work activities","Other/not applicable"].map(g => <Chk key={g} label={g} k={`goal2_${g}`} f={f} set={set} />)}</div>
      </div>
      <F label="How will progress on goals be evaluated?" k="goalEvalMethod" f={f} set={set} af={af} type="textarea" />
      <F label="If subsequent plan — applicant's improvement at end of previous plan" k="prevPlanImprovement" f={f} set={set} af={af} type="textarea" />
      <Radio label="Barriers to recovery identified?" name="barriers9" opts={["No","Yes"]} k="barriers9" f={f} set={set} />
      {f.barriers9==="Yes" && <F label="Explain barriers" k="barriers9Explain" f={f} set={set} af={af} type="textarea" />}
      <Radio label="Recommendations/strategies to overcome barriers?" name="barrierStrategies" opts={["No","Yes"]} k="barrierStrategies" f={f} set={set} />
      {f.barrierStrategies==="Yes" && <F label="Explain" k="barrierStrategiesExplain" f={f} set={set} af={af} type="textarea" />}
      <Radio label="Concurrent treatment by other provider/facility?" name="concurrentTx" opts={["No","Yes"]} k="concurrentTreatment" f={f} set={set} />
      {f.concurrentTreatment==="Yes" && <F label="Explain" k="concurrentTreatmentExplain" f={f} set={set} af={af} type="textarea" />}
    </Section>
    <SignatureBlock title="Part 10 — Applicant Signature" nameKey="appSigName" sigKey="appSig" dateKey="appSigDate" f={f} set={set} af={af} />
    <Section title="Part 11 — Health Care Providers">
      <div className="overflow-x-auto"><table className="w-full text-xs border-collapse">
        <thead><tr className="bg-muted">{["Ref","Provider Type","Last Name","First Name","Reg # / Unregulated","Hourly Rate"].map(h=><th key={h} className="border px-2 py-1.5 text-left font-medium">{h}</th>)}</tr></thead>
        <tbody>{providers.map((p,i) => (
          <tr key={i}><td className="border px-2 py-1 text-center font-semibold">{p.ref}</td>
            {["type","last","first","regNo","hourlyRate"].map(k => (
              <td key={k} className="border p-1"><Input value={(p as any)[k]} onChange={e=>setProviders(providers.map((x,j)=>j===i?{...x,[k]:e.target.value}:x))} className="h-7 text-xs border-0 focus-visible:ring-0 p-1" /></td>
            ))}
          </tr>
        ))}</tbody>
      </table></div>
    </Section>
    <Section title="Part 12 — Proposed Goods or Services">
      <div className="overflow-x-auto"><table className="w-full text-xs border-collapse">
        <thead><tr className="bg-muted">{["#","Description","Code","Attrib","Prov Ref","Qty","Measure","Cost","Total Count","Total Cost"].map(h=><th key={h} className="border px-2 py-1.5 text-left font-medium">{h}</th>)}</tr></thead>
        <tbody>{goods.map((g,i) => (
          <tr key={i}><td className="border px-2 py-1 text-center text-muted-foreground">{i+1}</td>
            {["desc","code","attrib","provRef","qty","measure","cost","totalCount","totalCost"].map(k => (
              <td key={k} className="border p-1"><Input value={(g as any)[k]} onChange={e=>setGoods(goods.map((x,j)=>j===i?{...x,[k]:e.target.value}:x))} className="h-7 text-xs border-0 focus-visible:ring-0 p-1" /></td>
            ))}
          </tr>
        ))}</tbody>
      </table></div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
        <F label="Estimated Duration (weeks)" k="planDurationWeeks" f={f} set={set} af={af} />
        <F label="Prior visits already provided" k="priorVisits" f={f} set={set} af={af} />
        <F label="Sub-Total ($)" k="planSubTotal" f={f} set={set} af={af} />
        <F label="Minus MOH ($)" k="planMinusMOH" f={f} set={set} af={af} />
        <F label="Minus Other Insurer 1+2 ($)" k="planMinusOther" f={f} set={set} af={af} />
        <F label="TAX (if applicable) ($)" k="planTax" f={f} set={set} af={af} />
        <F label="Auto Insurer Total ($)" k="planAutoTotal" f={f} set={set} af={af} />
        <F label="Applicant Initials (consent)" k="planInitials" f={f} set={set} af={af} />
      </div>
      <F label="Additional comments regarding proposed goods and services" k="planComments" f={f} set={set} af={af} type="textarea" />
      <Radio label="Are there attachments?" name="planAttach" opts={["Yes","No"]} k="planAttachments" f={f} set={set} />
      {f.planAttachments==="Yes" && <F label="How many attachments?" k="planAttachCount" f={f} set={set} af={af} />}
    </Section>
    <Section title="Part 13 — Insurer Signature">
      <p className="text-xs text-muted-foreground">The insurer shall, within 10 business days of receiving this plan, give the applicant a notice stating which goods and services it will or will not pay.</p>
      <Chk label="I waive the requirement of the Applicant's signature" k="insurerWaiveSig" f={f} set={set} />
      <div className="flex gap-4">{["Approve this Treatment and Assessment Plan","Partially approve","Do not approve"].map(o => <Chk key={o} label={o} k={`insurer_${o}`} f={f} set={set} />)}</div>
      <G3><F label="Name of Adjuster" k="adjusterName" f={f} set={set} af={af} /><F label="Signature of Adjuster" k="adjusterSig" f={f} set={set} af={af} /><F label="Date (yyyy/mm/dd)" k="adjusterDate" f={f} set={set} af={af} type="date" /></G3>
    </Section>
  </>);
}

function OCF19Form({ f, set, af }: { f:Record<string,string>; set:(k:string,v:string)=>void; af:Set<string> }) {
  return (<>
    <FormHeader f={f} set={set} af={af} />
    <Section title="Applicant Status">
      <div className="space-y-2">
        <Chk label="Applicant is under 18 and accepted for in-patient admission at a public hospital or paediatric rehabilitation facility" k="statusUnder18Hospital" f={f} set={set} />
        <Chk label="Applicant is currently in a general hospital, rehabilitation centre, nursing home or chronic care facility" k="statusCurrentlyInFacility" f={f} set={set} />
        <Chk label="This is the first application for catastrophic determination" k="statusFirstApplication" f={f} set={set} />
        <Chk label="This is a reapplication for catastrophic determination (attach reason)" k="statusReapplication" f={f} set={set} />
      </div>
    </Section>
    <Section title="Part 1 — Applicant Information">
      <G2><F label="Last Name" k="lastName" f={f} set={set} af={af} /><F label="First Name and Initial" k="firstName" f={f} set={set} af={af} /></G2>
      <F label="Address" k="address" f={f} set={set} af={af} />
      <G3><F label="City/Town" k="city" f={f} set={set} af={af} /><F label="Province" k="province" f={f} set={set} af={af} /><F label="Postal Code" k="postalCode" f={f} set={set} af={af} /></G3>
      <G3><F label="Home Telephone" k="homePhone" f={f} set={set} af={af} /><F label="Work Telephone" k="workPhone" f={f} set={set} af={af} /><F label="Extension" k="extension" f={f} set={set} af={af} /><F label="Email (optional)" k="email" f={f} set={set} af={af} /></G3>
      <G2><F label="Applicant Signature" k="appSig" f={f} set={set} af={af} /><F label="Date (yyyy/mm/dd)" k="appSigDate" f={f} set={set} af={af} type="date" /></G2>
    </Section>
    <Section title="Part 2 — Physician Information">
      <G2><F label="Name of Physician" k="physName" f={f} set={set} af={af} /><F label="College Registration Number" k="physCollegeReg" f={f} set={set} af={af} /><F label="Facility Name (if applicable)" k="physFacility" f={f} set={set} af={af} /><F label="AISI Facility Number" k="physAISI" f={f} set={set} af={af} /></G2>
      <F label="Address" k="physAddress" f={f} set={set} af={af} />
      <G3><F label="City" k="physCity" f={f} set={set} af={af} /><F label="Province" k="physProvince" f={f} set={set} af={af} /><F label="Postal Code" k="physPC" f={f} set={set} af={af} /></G3>
      <G3><F label="Telephone" k="physPhone" f={f} set={set} af={af} /><F label="Fax" k="physFax" f={f} set={set} af={af} /><F label="Email (optional)" k="physEmail" f={f} set={set} af={af} /></G3>
      <div className="space-y-2">
        <Label className="text-xs mb-2 block">Knowledge of Applicant</Label>
        <Chk label="Applicant is currently in my care" k="knowCurrentCare" f={f} set={set} />
        {f.knowCurrentCare==="Y" && <G2><F label="Date most recently seen" k="knowCurrentDate" f={f} set={set} af={af} type="date" /><F label="Number of years in my care" k="knowYearsInCare" f={f} set={set} af={af} /></G2>}
        <Chk label="Applicant was seen for the purpose of preparing this application" k="knowSeenForApp" f={f} set={set} />
        {f.knowSeenForApp==="Y" && <F label="Date seen" k="knowSeenForAppDate" f={f} set={set} af={af} type="date" />}
        <Chk label="Applicant was in my care but no longer actively followed" k="knowNotFollowed" f={f} set={set} />
        {f.knowNotFollowed==="Y" && <F label="Date last seen" k="knowNotFollowedDate" f={f} set={set} af={af} type="date" />}
        <Chk label="I have reviewed the file but have not seen the applicant" k="knowFileReview" f={f} set={set} />
        {f.knowFileReview==="Y" && <F label="Most relevant material dated" k="knowFileReviewDate" f={f} set={set} af={af} type="date" />}
        <Chk label="Seen for the purpose of evaluating impairment" k="knowImpairmentEval" f={f} set={set} />
        {f.knowImpairmentEval==="Y" && <F label="Number of times seen" k="knowImpairmentEvalCount" f={f} set={set} af={af} />}
      </div>
    </Section>
    <Section title="Part 3 — Catastrophic Impairment Criteria">
      <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
        <p className="text-xs text-blue-800 font-medium">Section A — Automatic Designation (Under 18 Only)</p>
        <div className="mt-2 space-y-1">
          <Chk label="1. Traumatic Brain Injury — accepted for in-patient admission at a public hospital with positive CT/MRI findings" k="critA1" f={f} set={set} />
          <Chk label="2. Traumatic Brain Injury — accepted for in-patient admission to a paediatric rehabilitation facility" k="critA2" f={f} set={set} />
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium">Section B — Criteria for All Applicants</p>
        {[
          ["critB1","1. Paraplegia or Tetraplegia"],
          ["critB2","2. Severe impairment of ambulatory mobility or use of an arm, or amputation"],
          ["critB3","3. Loss of Vision of Both Eyes"],
          ["critB4","4. Traumatic Brain Injury (applicant 18 years of age or older)"],
          ["critB5","5. Traumatic Brain Injury (applicant under 18 years of age)"],
          ["critB6","6. Physical Impairment resulting in 55% or more whole person impairment"],
          ["critB7","7. Mental/Behavioural Impairment (excluding TBI) combined with Physical resulting in 55%+ whole person"],
          ["critB8","8. Class 4 impairment (marked) in 3+ areas of function OR Class 5 (extreme) in 1+ areas, due to mental/behavioural disorder"],
        ].map(([k,lbl]) => <Chk key={k} label={lbl} k={k} f={f} set={set} />)}
      </div>
      <div className="mt-3 border-t pt-3">
        <Label className="text-xs mb-2 block">Additional Criteria Timing (for items 6, 7, 8)</Label>
        <div className="space-y-1">
          <Chk label="Two years have elapsed since the accident" k="addCritTwoYears" f={f} set={set} />
          <Chk label="Assessment conducted by physician 3+ months after accident confirms criteria" k="addCritThreeMonths" f={f} set={set} />
        </div>
      </div>
      <Chk label="Description of impairments attached" k="descAttached" f={f} set={set} />
    </Section>
    <SignatureBlock title="Part 5 — Physician Signature" nameKey="physSigName" sigKey="physSig" dateKey="physSigDate" f={f} set={set} af={af} />
  </>);
}

function OCF23Form({ f, set, af }: { f:Record<string,string>; set:(k:string,v:string)=>void; af:Set<string> }) {
  const [services, setServices] = useState([{category:"Minor Injury Guideline",desc:"",maxFee:"",estFee:""},{category:"Supplementary Goods & Services",desc:"",maxFee:"",estFee:""},{category:"Other Pre-approved Services (incl. radiology)",desc:"",maxFee:"",estFee:""}]);
  return (<>
    <FormHeader f={f} set={set} af={af} />
    <Section title="Part 1 — Applicant Information">
      <G3><F label="Date of Birth (YYYYMMDD)" k="dateOfBirth" f={f} set={set} af={af} type="date" /><F label="Gender" k="gender" f={f} set={set} af={af} /><F label="Telephone" k="phone" f={f} set={set} af={af} /><F label="Extension" k="extension" f={f} set={set} af={af} /></G3>
      <G3><F label="Last Name" k="lastName" f={f} set={set} af={af} /><F label="First Name" k="firstName" f={f} set={set} af={af} /><F label="Middle Name (optional)" k="middleName" f={f} set={set} af={af} /></G3>
      <F label="Address" k="address" f={f} set={set} af={af} />
      <G3><F label="City" k="city" f={f} set={set} af={af} /><F label="Province" k="province" f={f} set={set} af={af} /><F label="Postal Code" k="postalCode" f={f} set={set} af={af} /></G3>
    </Section>
    <InsuranceBlock f={f} set={set} af={af} withAdjuster />
    <OtherInsuranceBlock f={f} set={set} af={af} />
    <Section title="Part 4 — Initiating Health Practitioner Signature">
      <Chk label="I am not the first Initiating Health Practitioner" k="notFirstHP" f={f} set={set} />
      <HealthPractBlock title="" prefix="hp" f={f} set={set} af={af} types={HP_TYPES_6} />
    </Section>
    <InjuryBlock f={f} set={set} af={af} rows={4} />
    <Section title="Part 6 — Prior and Concurrent Conditions">
      <Radio label="a) Was the applicant employed at the time of the accident?" name="emp23" opts={["Yes","No"]} k="employedAtAccident" f={f} set={set} />
      <Radio label="b) Prior disease/condition/injury affecting treatment response?" name="priorCond23" opts={["No","Unknown","Yes"]} k="priorCondition23" f={f} set={set} />
      {f.priorCondition23==="Yes" && <F label="Explain" k="priorCondition23Explain" f={f} set={set} af={af} type="textarea" />}
      {f.priorCondition23==="Yes" && <>
        <Radio label="c) Prior investigation/treatment for this condition in past year?" name="priorTx23" opts={["No","Unknown","Yes"]} k="priorTreatment23" f={f} set={set} />
        {f.priorTreatment23==="Yes" && <F label="Explain and identify provider" k="priorTreatment23Explain" f={f} set={set} af={af} type="textarea" />}
      </>}
    </Section>
    <Section title="Part 7 — Barriers to Recovery">
      <Radio label="Barriers to recovery identified?" name="barriers23" opts={["No","Yes"]} k="barriers23" f={f} set={set} />
      {f.barriers23==="Yes" && <F label="Explain" k="barriers23Explain" f={f} set={set} af={af} type="textarea" />}
    </Section>
    <Section title="Part 8 — Direct Payment Assignment by Applicant">
      <p className="text-xs text-muted-foreground">I direct the insurer, including the MVACF, to pay the licensed service provider directly for the approved goods and services specified on this Treatment Confirmation Form.</p>
      <F label="Applicant Initials" k="directPayInitials" f={f} set={set} af={af} />
    </Section>
    <SignatureBlock title="Part 9 — Applicant Signature" nameKey="appSigName" sigKey="appSig" dateKey="appSigDate" f={f} set={set} af={af} />
    <Section title="Part 10 — Guideline Services">
      <div className="overflow-x-auto"><table className="w-full text-xs border-collapse">
        <thead><tr className="bg-muted">{["Category","Description","Maximum Fee","Estimated Fee"].map(h=><th key={h} className="border px-3 py-1.5 text-left font-medium">{h}</th>)}</tr></thead>
        <tbody>{services.map((s,i) => (
          <tr key={i}><td className="border px-3 py-1 font-medium">{s.category}</td>
            {["desc","maxFee","estFee"].map(k => (
              <td key={k} className="border p-1"><Input value={(s as any)[k]} onChange={e=>setServices(services.map((x,j)=>j===i?{...x,[k]:e.target.value}:x))} className="h-7 text-xs border-0 focus-visible:ring-0" /></td>
            ))}
          </tr>
        ))}</tbody>
        <tfoot><tr><td colSpan={2} className="border px-3 py-1 text-right font-semibold">Total</td>
          <td colSpan={2} className="border px-3 py-1 font-semibold">${services.reduce((s,e)=>s+(parseFloat(e.estFee)||0),0).toFixed(2)}</td>
        </tr></tfoot>
      </table></div>
      <Radio label="Are there attachments?" name="attach23" opts={["Yes","No"]} k="attachments23" f={f} set={set} />
      {f.attachments23==="Yes" && <F label="How many?" k="attachmentsCount" f={f} set={set} af={af} />}
    </Section>
    <Section title="Part 11 — Insurer Signature">
      <Chk label="I waive the requirement of the Applicant's signature" k="insurerWaive23" f={f} set={set} />
      <p className="text-xs text-muted-foreground mt-2">I have reviewed this Treatment Confirmation Form and confirm the policy was in force at the time of the accident.</p>
      <div className="flex gap-4">{["Approve","Do not approve"].map(o => <Chk key={o} label={o} k={`insurer23_${o}`} f={f} set={set} />)}</div>
      <G3><F label="Name of Adjuster" k="adjuster23Name" f={f} set={set} af={af} /><F label="Signature" k="adjuster23Sig" f={f} set={set} af={af} /><F label="Date (yyyy/mm/dd)" k="adjuster23Date" f={f} set={set} af={af} type="date" /></G3>
    </Section>
  </>);
}

// ════════════════════════════════════════════════════════════════════════════════
// MATRIX LEGAL SERVICES — INTERNAL INTAKE FORM (10 pages)
// Based on INTAKE_MASTER_07-04-2026.pdf — all sections faithfully reproduced
// ════════════════════════════════════════════════════════════════════════════════

// Post-accident conditions from page 6 of the intake PDF
const PHYSICAL_AREAS = [
  "Head","Face L/R","Eyes L/R","Nose L/R","Ears L/R","Jaw L/R","Teeth L/R","Neck L/R",
  "Shoulders L/R","Arms L/R","Wrists L/R","Hands L/R","Fingers L/R","Chest","Ribs L/R",
  "Abdomen L/R","Upper Back","Mid Back","Lower Back","Hips L/R","Pelvis L/R","Thighs L/R",
  "Knees L/R","Legs L/R","Ankles L/R","Feet L/R","Toes L/R",
  "Radiating pain down Arm(s) L/R","Radiating pain down Leg(s) L/R",
];

const NEURO_PSYCH = [
  "Headaches","Dizziness","Ringing in the ears","Problems with hearing","Blurred Vision",
  "Forgetfulness","Tingling","Numbness","Irritability","Anxiety","Stress","Depression",
  "Lack of sleep","Nightmares (general)","Flashbacks to MVA","Periodic crying",
  "Low self-esteem","Loss of incentive","Fear of Driving","Nervous when a passenger",
  "Withdraw from others","Poor appetite","Loss of weight","Decrease sex drive",
  "Fatigue/low energy","Short-tempered","Spousal arguments","Over-react to small things",
  "Excessive worry","Suicidal thought",
];

function MatrixIntakeForm({ f, set, af }: { f:Record<string,string>; set:(k:string,v:string)=>void; af:Set<string> }) {
  return (<>
    {/* ── Page 1: Initial Interview Header ── */}
    <Section title="Initial Interview — Header">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Radio label="Conflict Checked?" name="conflictChecked" opts={["Yes","No"]} k="conflictChecked" f={f} set={set} />
        <Radio label="Conflict Find?" name="conflictFind" opts={["Yes","No"]} k="conflictFind" f={f} set={set} />
        <F label="File No." k="fileNo" f={f} set={set} af={af} />
        <F label="Percent (%)" k="percent" f={f} set={set} af={af} />
      </div>
      <G2>
        <F label="Date of MVA" k="dateOfMVA" f={f} set={set} af={af} type="date" />
        <F label="Client Interviewed By" k="interviewedBy" f={f} set={set} af={af} />
        <F label="Client Interviewed On" k="interviewedOn" f={f} set={set} af={af} type="date" />
        <F label="Client Referred By" k="referredBy" f={f} set={set} af={af} />
      </G2>
    </Section>

    {/* ── Page 1-2: Personal Data ── */}
    <Section title="Part Two: Personal Data">
      <div className="grid grid-cols-3 gap-3">
        <Radio label="Gender" name="gender" opts={["Male","Female"]} k="gender" f={f} set={set} />
        <F label="Last Name" k="lastName" f={f} set={set} af={af} />
        <F label="First Name" k="firstName" f={f} set={set} af={af} />
      </div>
      <F label="First and Last Name (combined)" k="fullName" f={f} set={set} af={af} />
      <div className="grid grid-cols-4 gap-3">
        <F label="Unit No" k="unitNo" f={f} set={set} af={af} />
        <div className="col-span-3"><F label="Street No & Name" k="streetAddress" f={f} set={set} af={af} /></div>
      </div>
      <G3>
        <F label="City" k="city" f={f} set={set} af={af} />
        <F label="Province" k="province" f={f} set={set} af={af} />
        <F label="Post Code" k="postalCode" f={f} set={set} af={af} />
      </G3>
      <G3>
        <F label="Date of Birth (yyyy/mm/dd)" k="dateOfBirth" f={f} set={set} af={af} type="date" />
        <F label="Age" k="age" f={f} set={set} af={af} />
        <div />
      </G3>
      <G3>
        <F label="Home Phone" k="homePhone" f={f} set={set} af={af} />
        <F label="Cell Phone" k="cellPhone" f={f} set={set} af={af} />
        <F label="Work Phone" k="workPhone" f={f} set={set} af={af} />
        <F label="E-Mail" k="email" f={f} set={set} af={af} />
      </G3>
      <Radio label="Marital Status" name="maritalStatus" opts={["Single","Married","C-Law","Separated","Divorced","Widow"]} k="maritalStatus" f={f} set={set} />

      {/* ID Documents */}
      <div className="space-y-2 border rounded-md p-3 mt-2">
        <Label className="text-xs font-semibold">Identification Documents</Label>
        {[
          ["driverLicenseNo","driverLicenseCopy","Driver's License No."],
          ["healthCardNo","healthCardCopy","Health Card No."],
          ["sinNo","sinCopy","Social Insurance No."],
        ].map(([numKey,copyKey,lbl]) => (
          <div key={numKey} className="grid grid-cols-12 gap-2 items-center">
            <Label className="col-span-4 text-xs">{lbl}</Label>
            <div className="col-span-5"><Input value={f[numKey]||""} onChange={e=>set(numKey,e.target.value)} className="h-8 text-xs" /></div>
            <div className="col-span-3 flex items-center gap-2">
              <Label className="text-xs">Copy?</Label>
              <Radio label="" name={copyKey} opts={["Yes","No"]} k={copyKey} f={f} set={set} />
            </div>
          </div>
        ))}
        <div className="grid grid-cols-12 gap-2 items-center">
          <div className="col-span-4 flex gap-3">
            <Chk label="Ontario ID Card" k="hasOntarioID" f={f} set={set} />
            <Chk label="PR" k="hasPR" f={f} set={set} />
            <Chk label="Citizen" k="hasCitizen" f={f} set={set} />
          </div>
          <div className="col-span-5"><F label="No." k="prCitizenNo" f={f} set={set} af={af} /></div>
          <div className="col-span-3 flex items-center gap-2">
            <Label className="text-xs">Copy?</Label>
            <Radio label="" name="prCitizenCopy" opts={["Yes","No"]} k="prCitizenCopy" f={f} set={set} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Radio label="Dependants?" name="hasDependants" opts={["Yes","No"]} k="hasDependants" f={f} set={set} />
        {f.hasDependants==="Yes" && <F label="Number of dependants" k="numDependants" f={f} set={set} af={af} />}
      </div>

      <div>
        <Label className="text-xs mb-2 block">Client chooses to receive the following benefit:</Label>
        <div className="flex flex-wrap gap-4">
          {["Income Replacement Benefit","Non-Earner Benefit","Caregiver Benefit"].map(b => (
            <label key={b} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="benefitChoice" value={b} checked={f.benefitChoice===b} onChange={()=>set("benefitChoice",b)} className="h-3.5 w-3.5" />
              {b}
            </label>
          ))}
        </div>
      </div>
    </Section>

    {/* ── Page 2: Language / Accident Details ── */}
    <Section title="Language & Background">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Radio label="Does the client speak English?" name="speaksEnglish" opts={["Yes","No"]} k="speaksEnglish" f={f} set={set} />
        <Radio label="Requires an interpreter?" name="needsInterpreter" opts={["Yes","No"]} k="needsInterpreter" f={f} set={set} />
        {f.needsInterpreter==="Yes" && <F label="Language?" k="interpreterLanguage" f={f} set={set} af={af} />}
        <Radio label="Was client born in Canada?" name="bornInCanada" opts={["Yes","No"]} k="bornInCanada" f={f} set={set} />
        {f.bornInCanada==="No" && <><F label="Where?" k="bornWhere" f={f} set={set} af={af} /><F label="Year immigrated to Canada?" k="yearImmigrated" f={f} set={set} af={af} /></>}
      </div>
      <div>
        <Label className="text-xs mb-2 block">Client was a:</Label>
        <div className="flex flex-wrap gap-3">
          {["Driver of Vehicle Insured under this Policy","Passenger of Vehicle Insured under this Policy","Pedestrian or Cyclist","Driver or Passenger of a vehicle not insured under this Policy"].map(r => <Chk key={r} label={r} k={`role_${r}`} f={f} set={set} />)}
        </div>
        <F label="Other" k="roleOther" f={f} set={set} af={af} />
      </div>
      <Radio label="Seat Belted?" name="seatBelted" opts={["Yes","No"]} k="seatBelted" f={f} set={set} />
    </Section>

    <Section title="Accident Details">
      <Radio label="Did the accident occur while at work?" name="accidentAtWork" opts={["Yes","No"]} k="accidentAtWork" f={f} set={set} />
      {f.accidentAtWork==="Yes" && <Radio label="If yes, did client file claim with W.S.I.B?" name="wsibClaim" opts={["Yes","No"]} k="wsibClaim" f={f} set={set} />}
      <div>
        <Label className="text-xs mb-2 block font-medium">Accident Location</Label>
        <G3>
          <F label="Street Name" k="accidentStreet" f={f} set={set} af={af} />
          <F label="Major Intersection" k="accidentIntersection" f={f} set={set} af={af} />
          <F label="City" k="accidentCity" f={f} set={set} af={af} />
          <F label="Province" k="accidentProvince" f={f} set={set} af={af} />
          <F label="Time of M.V.A" k="timeOfMVA" f={f} set={set} af={af} type="time" />
        </G3>
      </div>
      <G2>
        <Radio label="Accident Reported to the Police?" name="policeReported" opts={["Yes","No"]} k="policeReported" f={f} set={set} />
        {f.policeReported==="Yes" && <F label="Date of Report" k="policeReportDate" f={f} set={set} af={af} type="date" />}
        <Radio label="Did Police come to Scene?" name="policeCameToScene" opts={["Yes","No"]} k="policeCameToScene" f={f} set={set} />
        <F label="Police Department / Collision Reporting Centre" k="policeDepartment" f={f} set={set} af={af} />
        <F label="Incident No." k="incidentNo" f={f} set={set} af={af} />
        <F label="Officer" k="officerName" f={f} set={set} af={af} />
        <F label="Badge No." k="badgeNo" f={f} set={set} af={af} />
      </G2>
      <G2>
        <Radio label="Was the client charged?" name="clientCharged" opts={["Yes","No"]} k="clientCharged" f={f} set={set} />
        {f.clientCharged==="Yes" && <F label="Description" k="clientChargedDesc" f={f} set={set} af={af} />}
        <Radio label="Was Third Party charged?" name="thirdPartyCharged" opts={["Yes","No"]} k="thirdPartyCharged" f={f} set={set} />
        {f.thirdPartyCharged==="Yes" && <F label="Description" k="thirdPartyChargedDesc" f={f} set={set} af={af} />}
      </G2>
      <G3>
        <F label="Number of Occupants in Vehicle" k="numOccupants" f={f} set={set} af={af} />
        <F label="Seating Arrangement" k="seatingArrangement" f={f} set={set} af={af} />
        <Radio label="Photos of damages?" name="photosOfDamage" opts={["Yes","No"]} k="photosOfDamage" f={f} set={set} />
        <F label="Estimated Property Damage ($)" k="estimatedDamage" f={f} set={set} af={af} />
      </G3>
      <F label="Brief description of how the accident occurred" k="accidentDescription" f={f} set={set} af={af} type="textarea" rows={4} />
    </Section>

    {/* ── Page 3: Insurance Company (First Party) ── */}
    <Section title="Insurance Company Information">
      <div className="flex flex-wrap gap-4 mb-3">
        {["Own Policy","Dependant Policy","Spousal Policy","Listed as Driver"].map(p => <Chk key={p} label={p} k={`policyType_${p}`} f={f} set={set} />)}
      </div>
      <div className="border-l-4 border-primary pl-4 space-y-3">
        <Label className="text-xs font-bold uppercase tracking-wide">First Party Insurance Information</Label>
        <F label="Name of Insurance Company" k="fp_insurerName" f={f} set={set} af={af} />
        <F label="Address" k="fp_insurerAddress" f={f} set={set} af={af} />
        <G3>
          <F label="City" k="fp_insurerCity" f={f} set={set} af={af} />
          <F label="Province" k="fp_insurerProvince" f={f} set={set} af={af} />
          <F label="Post Code" k="fp_insurerPC" f={f} set={set} af={af} />
        </G3>
        <G2>
          <F label="Adjuster" k="fp_adjuster" f={f} set={set} af={af} />
          <F label="E-mail" k="fp_adjusterEmail" f={f} set={set} af={af} />
          <F label="Phone No." k="fp_phone" f={f} set={set} af={af} />
          <F label="Fax No." k="fp_fax" f={f} set={set} af={af} />
          <F label="Policy No." k="fp_policyNo" f={f} set={set} af={af} />
          <F label="Claim No." k="fp_claimNo" f={f} set={set} af={af} />
          <F label="Name of Policy Holder" k="fp_policyHolder" f={f} set={set} af={af} />
        </G2>
        <G3>
          <F label="Automobile Make" k="fp_autoMake" f={f} set={set} af={af} />
          <F label="Model" k="fp_autoModel" f={f} set={set} af={af} />
          <F label="Year" k="fp_autoYear" f={f} set={set} af={af} />
          <F label="License Plate Number" k="fp_plateNo" f={f} set={set} af={af} />
        </G3>
        <Radio label="Was the client an occupant of this vehicle at the time of the accident?" name="fp_occupant" opts={["Yes","No"]} k="fp_wasOccupant" f={f} set={set} />
        <div className="flex flex-wrap gap-3">
          {["Employee of the Policyholder","I have no relationship to the Policyholder","A vehicle you rented or leased for more than 30 days"].map(r => <Chk key={r} label={r} k={`fp_rel_${r}`} f={f} set={set} />)}
        </div>
        <Radio label="Aware of any coverage under any other policies?" name="fp_otherCoverage" opts={["Yes","No","I don't know"]} k="fp_otherCoverage" f={f} set={set} />
      </div>
    </Section>

    {/* ── Page 4: Third Party Insurance ── */}
    <Section title="Third Party Insurance Information">
      <G2>
        <F label="Driver (name)" k="tp_driverName" f={f} set={set} af={af} />
        <F label="Driver's License No." k="tp_driverLicenseNo" f={f} set={set} af={af} />
        <F label="Address" k="tp_driverAddress" f={f} set={set} af={af} />
        <F label="Phone No." k="tp_driverPhone" f={f} set={set} af={af} />
        <F label="Name of Insurance Company" k="tp_insurerName" f={f} set={set} af={af} />
        <F label="Address" k="tp_insurerAddress" f={f} set={set} af={af} />
        <F label="Name of Adjuster" k="tp_adjuster" f={f} set={set} af={af} />
        <F label="Phone No." k="tp_phone" f={f} set={set} af={af} />
        <F label="Fax No." k="tp_fax" f={f} set={set} af={af} />
        <F label="Policy No." k="tp_policyNo" f={f} set={set} af={af} />
        <F label="Claim No." k="tp_claimNo" f={f} set={set} af={af} />
        <F label="Name of Policy Holder" k="tp_policyHolder" f={f} set={set} af={af} />
      </G2>
      <G3>
        <F label="Automobile Make" k="tp_autoMake" f={f} set={set} af={af} />
        <F label="Model" k="tp_autoModel" f={f} set={set} af={af} />
        <F label="Year" k="tp_autoYear" f={f} set={set} af={af} />
        <F label="License Plate Number" k="tp_plateNo" f={f} set={set} af={af} />
      </G3>
    </Section>

    {/* ── Page 4-5: Medical & Treatment ── */}
    <Section title="Medical & Treatment Information">
      <G2>
        <Radio label="Did the client go to Hospital?" name="wentHospital" opts={["Yes","No"]} k="wentToHospital" f={f} set={set} />
        <Radio label="Ambulance required?" name="ambulance" opts={["Yes","No"]} k="ambulanceRequired" f={f} set={set} />
      </G2>
      {f.wentToHospital==="Yes" && (
        <div className="border rounded p-3 space-y-2">
          <F label="Name of Hospital" k="hospitalName" f={f} set={set} af={af} />
          <F label="Address" k="hospitalAddress" f={f} set={set} af={af} />
          <G3>
            <F label="Admission Date" k="admissionDate" f={f} set={set} af={af} type="date" />
            <F label="Discharge Date" k="dischargeDate" f={f} set={set} af={af} type="date" />
            <Radio label="X-Ray Taken?" name="xrayTaken" opts={["Yes","No"]} k="xrayTaken" f={f} set={set} />
          </G3>
        </div>
      )}

      <div className="border-t pt-3">
        <Label className="text-xs font-semibold mb-2 block">Family Doctor</Label>
        <F label="Family Physician" k="familyDoctor" f={f} set={set} af={af} />
        <F label="Address" k="familyDoctorAddress" f={f} set={set} af={af} />
        <G3>
          <F label="City" k="familyDoctorCity" f={f} set={set} af={af} />
          <F label="Province" k="familyDoctorProvince" f={f} set={set} af={af} />
          <F label="Post Code" k="familyDoctorPC" f={f} set={set} af={af} />
          <F label="Phone No." k="familyDoctorPhone" f={f} set={set} af={af} />
          <F label="Fax No." k="familyDoctorFax" f={f} set={set} af={af} />
        </G3>
      </div>
    </Section>

    <Section title="Physio, Chiro, Massage & Treatment Providers">
      {[1,2,3,4].map(n => (
        <div key={n} className="border rounded p-3 space-y-2">
          <Label className="text-xs font-semibold">Treatment Provider #{n}</Label>
          <F label="Treatment Centre" k={`tp${n}_centre`} f={f} set={set} af={af} />
          <F label="Address" k={`tp${n}_address`} f={f} set={set} af={af} />
          <G2>
            <F label="Phone No." k={`tp${n}_phone`} f={f} set={set} af={af} />
            <F label="Fax No." k={`tp${n}_fax`} f={f} set={set} af={af} />
          </G2>
          <div>
            <Label className="text-xs mb-1 block">Type of Treatment</Label>
            <div className="flex flex-wrap gap-3">
              {["Physio","Chiro","Rehab","Psych","Massage"].map(t => <Chk key={t} label={t} k={`tp${n}_type_${t}`} f={f} set={set} />)}
            </div>
          </div>
        </div>
      ))}
      <div>
        <Label className="text-xs font-semibold mb-2 block">List of Medication Prescribed</Label>
        <div className="grid grid-cols-2 gap-2">
          {[1,2,3,4].map(n => <F key={n} label={`Medication ${n}`} k={`medication${n}`} f={f} set={set} af={af} />)}
        </div>
      </div>
    </Section>

    {/* ── Page 6: Post-accident conditions ── */}
    <Section title="Post-Accident Medical Conditions" defaultOpen={false}>
      <p className="text-xs text-muted-foreground mb-2">Select all areas of pain and discomfort:</p>
      <div>
        <Label className="text-xs font-medium mb-1.5 block">Physical Areas</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
          {PHYSICAL_AREAS.map(c => <Chk key={c} label={c} k={`postPhysical_${c}`} f={f} set={set} />)}
        </div>
      </div>
      <div className="mt-3">
        <Label className="text-xs font-medium mb-1.5 block">Neurological & Psychological Symptoms</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
          {NEURO_PSYCH.map(c => <Chk key={c} label={c} k={`postNeuro_${c}`} f={f} set={set} />)}
        </div>
      </div>

      <div className="border-t pt-3 mt-3">
        <Label className="text-xs font-semibold mb-2 block">Pre-Accident Medical Conditions</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <F label="Condition" k="preCondition" f={f} set={set} af={af} />
          <F label="Time Frame" k="preTimeFrame" f={f} set={set} af={af} />
          <F label="Operative Procedure" k="preOperativeProcedure" f={f} set={set} af={af} />
          <F label="Pre-accident Status" k="preAccidentStatus" f={f} set={set} af={af} />
          <F label="Post-accident Status" k="postAccidentStatus" f={f} set={set} af={af} />
        </div>
      </div>
    </Section>

    {/* ── Page 7-8: Financial & Income ── */}
    <Section title="Financial & Income Information">
      <div>
        <Label className="text-xs mb-2 block font-medium">Employment Status at Time of Accident</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            ["empFullTime","Employed — highest average weekly income (last 52 weeks / last 4 weeks)"],
            ["empSelfEmployed","Self-Employed"],
            ["empUnemployed26","Unemployed but worked 26 weeks in last 52 weeks"],
            ["empContract","Written contract/agreement to start work within one year"],
            ["empEI","Client is receiving E.I. benefits"],
            ["empUnemployed","Unemployed"],
            ["empRetired","Retired"],
            ["empStudent","Student or Recent Graduate"],
            ["empCaregiver","Caregiver"],
          ].map(([k,lbl]) => <Chk key={k} label={lbl} k={k} f={f} set={set} />)}
        </div>
      </div>
      <Radio label="Loss of Income / Loss Competitive Advantage Claim?" name="lossOfIncome" opts={["Yes","No"]} k="lossOfIncome" f={f} set={set} />

      {[1,2,3].map(n => (
        <div key={n} className="border rounded p-3 space-y-2">
          <Label className="text-xs font-semibold">Current Employer {n}</Label>
          <G2>
            <F label="Employer" k={`emp${n}_name`} f={f} set={set} af={af} />
            <F label="Address" k={`emp${n}_address`} f={f} set={set} af={af} />
            <F label="Phone" k={`emp${n}_phone`} f={f} set={set} af={af} />
            <F label="Fax" k={`emp${n}_fax`} f={f} set={set} af={af} />
            <F label="Occupation" k={`emp${n}_occupation`} f={f} set={set} af={af} />
            <F label="Salary / Wages ($)" k={`emp${n}_salary`} f={f} set={set} af={af} />
            <F label="Hours worked (per week)" k={`emp${n}_hoursPerWeek`} f={f} set={set} af={af} />
            <F label="Length of Employment" k={`emp${n}_length`} f={f} set={set} af={af} />
            <F label="Last Day Worked" k={`emp${n}_lastDay`} f={f} set={set} af={af} type="date" />
          </G2>
          <div>
            <Label className="text-xs mb-1 block">Nature of Work</Label>
            <div className="flex gap-4">{["Light","Medium","Heavy"].map(t => <Chk key={t} label={t} k={`emp${n}_nature_${t}`} f={f} set={set} />)}</div>
          </div>
        </div>
      ))}
      <Radio label="Did client go back to Work?" name="returnedToWork" opts={["Yes","No"]} k="returnedToWork" f={f} set={set} />
    </Section>

    {/* ── Page 8: Caregiver ── */}
    <Section title="Caregiver Information">
      <Radio label="Was the client the primary caregiver for anyone (children under 16 or dependents mentally disabled) prior to the M.V.A?" name="wasPrimaryCaregiver" opts={["Yes","No"]} k="wasPrimaryCaregiver" f={f} set={set} />
      {f.wasPrimaryCaregiver==="Yes" && (
        <>
          <div className="space-y-2">
            {[1,2,3,4,5,6].map(n => (
              <div key={n} className="grid grid-cols-7 gap-2 items-center">
                <Label className="text-xs">{n}.</Label>
                <div className="col-span-3"><F label={n===1?"Name":""} k={`cg${n}_name`} f={f} set={set} af={af} /></div>
                <div className="col-span-2"><F label={n===1?"Date of Birth":""} k={`cg${n}_dob`} f={f} set={set} af={af} type="date" /></div>
                <div className="flex items-center gap-1"><Label className="text-xs">Disabled?</Label><Radio label="" name={`cg${n}_disabled`} opts={["Yes","No"]} k={`cg${n}_disabled`} f={f} set={set} /></div>
              </div>
            ))}
          </div>
          <Radio label="Do the client's injuries prevent him/her from performing caregiving activities?" name="injuriesPreventCaregiving" opts={["Yes","No"]} k="injuriesPreventCaregiving" f={f} set={set} />
          <G2>
            <F label="From (date unable to provide care)" k="caregivingFrom" f={f} set={set} af={af} type="date" />
            <F label="Return to caregiving duties?" k="caregivingReturn" f={f} set={set} af={af} type="date" />
          </G2>
          <F label="Explanation" k="caregivingExplanation" f={f} set={set} af={af} type="textarea" />
        </>
      )}
    </Section>

    {/* ── Page 9: Education / Other Insurance ── */}
    <Section title="Education / Training">
      <F label="Name of Institution" k="eduInstitution" f={f} set={set} af={af} />
      <F label="Address" k="eduAddress" f={f} set={set} af={af} />
      <G3>
        <Radio label="Client still attending school?" name="stillAttending" opts={["Yes","No"]} k="stillAttendingSchool" f={f} set={set} />
        <F label="Date Last Attended" k="dateLastAttended" f={f} set={set} af={af} type="date" />
        <F label="Projected Completion" k="projectedCompletion" f={f} set={set} af={af} type="date" />
      </G3>
      <F label="Career Goals" k="careerGoals" f={f} set={set} af={af} />
      <G2>
        <Radio label="Was client able to return to school following M.V.A?" name="returnedSchool" opts={["Yes","No"]} k="returnedToSchool" f={f} set={set} />
        {f.returnedToSchool==="Yes" && <F label="Date returned" k="returnedSchoolDate" f={f} set={set} af={af} type="date" />}
      </G2>
      <G2>
        <F label="Course/Activities Dropped 1" k="courseDropped1" f={f} set={set} af={af} />
        <F label="Course/Activities Dropped 2" k="courseDropped2" f={f} set={set} af={af} />
      </G2>
    </Section>

    <Section title="Other Insurance / Collateral Benefits">
      <Radio label="Does the client or spouse or anyone dependent on them have any other benefit plan?" name="otherBenefitPlan" opts={["Yes","No"]} k="hasOtherBenefitPlan" f={f} set={set} />
      {f.hasOtherBenefitPlan==="Yes" && (
        <G3>
          <F label="Name of Insurance" k="otherInsuranceName" f={f} set={set} af={af} />
          <F label="Type of Insurance" k="otherInsuranceType" f={f} set={set} af={af} />
          <F label="Policy/Certificate No." k="otherInsurancePolicyNo" f={f} set={set} af={af} />
        </G3>
      )}
      {[
        ["receivedDisabilityIncome","In the last 52 weeks, has the client received any income from a disability plan?","disabilityFrom","disabilityTo"],
        ["receivingEI","Is the client receiving employment insurance benefits?","eiFrom","eiTo"],
        ["receivingWelfare","Is the client receiving social assistance (Welfare)?","welfareFrom","welfareTo"],
      ].map(([k,lbl,fromK,toK]) => (
        <div key={k as string}>
          <Radio label={lbl as string} name={k as string} opts={["Yes","No"]} k={k as string} f={f} set={set} />
          {f[k as string]==="Yes" && <G2><F label="From" k={fromK as string} f={f} set={set} af={af} type="date" /><F label="To" k={toK as string} f={f} set={set} af={af} type="date" /></G2>}
        </div>
      ))}
    </Section>

    {/* ── Page 10: Income Tax / Expenses ── */}
    <Section title="Income Tax Status">
      <Radio label="Was the client paying support on the date of the accident?" name="payingSupport" opts={["Yes","No"]} k="payingSupport" f={f} set={set} />
      {f.payingSupport==="Yes" && <G2><F label="From (date)" k="supportFrom" f={f} set={set} af={af} type="date" /><F label="Total paid ($)" k="supportTotalPaid" f={f} set={set} af={af} /></G2>}
      <Radio label="Marital status for tax purposes" name="taxMaritalStatus" opts={["Single","Married","Equivalent to married"]} k="taxMaritalStatus" f={f} set={set} />
      <G2>
        <F label="Expected annual income of spouse (calendar year of MVA) ($)" k="spouseIncome1" f={f} set={set} af={af} />
        <F label="Expected annual income of spouse (following calendar year) ($)" k="spouseIncome2" f={f} set={set} af={af} />
      </G2>
      <Radio label="Did the client claim the disability amount non-refundable tax credit on their recent income tax return?" name="taxDisabilityClaim" opts={["Yes","No"]} k="taxDisabilityClaim" f={f} set={set} />
    </Section>

    <Section title="Expense Information (Housekeeper / Caregiver / Care Person)">
      {[
        ["hk","Housekeeper"],
        ["carg","Caregiver"],
        ["care","Care Person"],
      ].map(([p,lbl]) => (
        <div key={p} className="border rounded p-3 space-y-2">
          <Label className="text-xs font-semibold">{lbl}</Label>
          <G2>
            <F label={`Name of ${lbl}`} k={`${p}_name`} f={f} set={set} af={af} />
            <F label="Address" k={`${p}_address`} f={f} set={set} af={af} />
            <F label="Phone" k={`${p}_phone`} f={f} set={set} af={af} />
            <F label="No. of hours worked per week" k={`${p}_hoursPerWeek`} f={f} set={set} af={af} />
            <F label="Amount paid per week ($)" k={`${p}_amountPerWeek`} f={f} set={set} af={af} />
          </G2>
          <div className="flex gap-4"><Chk label="Cash" k={`${p}_cash`} f={f} set={set} /><Chk label="Cheques" k={`${p}_cheques`} f={f} set={set} /></div>
        </div>
      ))}
    </Section>

    {/* ── Authorization Letters ── */}
    <Section title="Matrix Legal — Authorization Letters" defaultOpen={false}>
      <p className="text-xs text-muted-foreground mb-3">These fields populate the Matrix Legal authorization and direction letters.</p>
      <G2>
        <F label="To (Insurance Company / Recipient)" k="authTo" f={f} set={set} af={af} />
        <F label="RE (Client name / reference)" k="authRE" f={f} set={set} af={af} />
        <F label="Client Full Name (for authorization)" k="authClientName" f={f} set={set} af={af} />
        <F label="Health Card No. (for OHIP authorization)" k="authHealthCardNo" f={f} set={set} af={af} />
        <F label="Dated at (city)" k="authDatedAt" f={f} set={set} af={af} />
        <F label="Day" k="authDay" f={f} set={set} af={af} />
        <F label="Month" k="authMonth" f={f} set={set} af={af} />
        <F label="Year" k="authYear" f={f} set={set} af={af} />
        <F label="Witness Name" k="authWitness" f={f} set={set} af={af} />
      </G2>
    </Section>

    {/* ── Contingency Fee Retainer ── */}
    <Section title="Contingency Fee Retainer Agreement" defaultOpen={false}>
      <p className="text-xs text-muted-foreground mb-3">Matrix Legal Services Professional Corporation — 2190 Warden Avenue, Suite 202, Scarborough, Ontario M1T 1V6 — Tel: 416-494-3857</p>
      <G2>
        <F label="Client Full Name" k="retainerClientName" f={f} set={set} af={af} />
        <F label="Day of accident" k="retainerAccidentDay" f={f} set={set} af={af} />
        <F label="Month of accident" k="retainerAccidentMonth" f={f} set={set} af={af} />
        <F label="Year of accident" k="retainerAccidentYear" f={f} set={set} af={af} />
        <F label="Location of accident (city)" k="retainerAccidentCity" f={f} set={set} af={af} />
        <F label="Contingency Fee Percentage (%)" k="retainerFeePercent" f={f} set={set} af={af} />
        <F label="Dated at (city)" k="retainerDatedAt" f={f} set={set} af={af} />
        <F label="Day signed" k="retainerSignDay" f={f} set={set} af={af} />
        <F label="Month signed" k="retainerSignMonth" f={f} set={set} af={af} />
        <F label="Year signed" k="retainerSignYear" f={f} set={set} af={af} />
        <F label="Client Phone No." k="retainerClientPhone" f={f} set={set} af={af} />
      </G2>
      <F label="Print Client's Name" k="retainerClientPrintName" f={f} set={set} af={af} />
    </Section>
  </>);
}

// ── Map template ID → form component ─────────────────────────────────────────
const FORM_MAP: Record<string, any> = {
  "ocf-1":  OCF1Form,
  "ocf-2":  OCF2Form,
  "ocf-3":  OCF3Form,
  "ocf-4":  OCF4Form,
  "ocf-5":  OCF5Form,
  "ocf-6":  OCF6Form,
  "ocf-10": OCF10Form,
  "ocf-18": OCF18Form,
  "ocf-19": OCF19Form,
  "ocf-23": OCF23Form,
  "matrix-intake": MatrixIntakeForm,
};

// ── PDF generation using jsPDF ────────────────────────────────────────────────
async function exportToPDF(fields: Record<string,any>, templateName: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"letter" });

  const margin = 20;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const usableW = pageW - margin * 2;
  let y = margin;

  function checkPage(needed = 10) {
    if (y + needed > pageH - margin) { doc.addPage(); y = margin; }
  }

  function heading(text: string) {
    checkPage(12);
    doc.setFontSize(11);
    doc.setFont("helvetica","bold");
    doc.setFillColor(230,230,240);
    doc.rect(margin, y-4, usableW, 8, "F");
    doc.text(text, margin+2, y);
    y += 7;
    doc.setFont("helvetica","normal");
    doc.setFontSize(9);
  }

  function field(label: string, value: string) {
    if (!value) return;
    checkPage(7);
    doc.setFont("helvetica","bold"); doc.setFontSize(8);
    doc.text(label + ":", margin, y);
    doc.setFont("helvetica","normal"); doc.setFontSize(9);
    const lines = doc.splitTextToSize(value, usableW - 55);
    doc.text(lines, margin + 55, y);
    y += Math.max(6, lines.length * 5);
  }

  function checkbox(label: string, checked: boolean) {
    if (!checked) return;
    checkPage(6);
    doc.setFontSize(9);
    doc.text(`☑ ${label}`, margin + 4, y); y += 5;
  }

  // Title
  doc.setFontSize(16); doc.setFont("helvetica","bold");
  doc.text(templateName, pageW/2, y, { align:"center" });
  y += 7;
  doc.setFontSize(9); doc.setFont("helvetica","normal");
  doc.text("Government of Ontario — AF Form (2025/2026)", pageW/2, y, {align:"center"});
  y += 5;
  doc.setDrawColor(100); doc.line(margin, y, pageW-margin, y); y += 7;

  // Dump all fields intelligently
  const sections: Record<string, Record<string,string>> = {};
  const checkboxFields: {label:string;value:boolean}[] = [];

  Object.entries(fields).forEach(([k, v]) => {
    if (!v || v === "" || v === "N") return;
    if (typeof v === "string" && v === "Y") {
      // It's a checked checkbox — derive a readable label
      const lbl = k.replace(/_/g," ").replace(/([A-Z])/g," $1").trim()
        .replace(/^rel /,"Relationship: ").replace(/^inv /,"Involvement: ")
        .replace(/^status /,"Status: ").replace(/^resp /,"Response: ")
        .replace(/^cov /,"Coverage: ").replace(/^goal1 /,"Goal (impairment): ")
        .replace(/^goal2 /,"Goal (functional): ").replace(/^insurer /,"Insurer decision: ")
        .replace(/^critB/,"Criterion B").replace(/^critA/,"Criterion A")
        .replace(/^empType /,"Employment type: ").replace(/^period/,"Period: ");
      checkboxFields.push({ label: lbl, value: true });
    } else if (typeof v === "string") {
      // Readable key
      const sectionMatch = k.match(/^([a-z]+\d*)[A-Z]/);
      const section = "General";
      if (!sections[section]) sections[section] = {};
      sections[section][k] = v;
    }
  });

  // Print header fields first
  heading("Form Header");
  ["claimNumber","policyNumber","dateOfAccident"].forEach(k => {
    const labels: Record<string,string> = { claimNumber:"Claim Number", policyNumber:"Policy Number", dateOfAccident:"Date of Accident" };
    if (fields[k]) field(labels[k], fields[k]);
  });

  // Print all other non-empty string fields
  const printed = new Set(["claimNumber","policyNumber","dateOfAccident"]);
  let currentSection = "";
  Object.entries(fields).forEach(([k,v]) => {
    if (printed.has(k) || !v || v==="" || v==="N") return;
    if (typeof v === "string" && v !== "Y") {
      // Make label readable
      const lbl = k.replace(/([A-Z])/g," $1").replace(/^./,c=>c.toUpperCase())
        .replace(/ Hp /," HP ").replace(/ Id$/," ID").replace(/Url$/,"URL")
        .replace(/Dob$/,"DOB").trim();
      field(lbl, v);
      printed.add(k);
    }
  });

  // Checkboxes as a group
  if (checkboxFields.length > 0) {
    heading("Selections & Confirmations");
    checkboxFields.forEach(cb => checkbox(cb.label, cb.value));
  }

  // Footer on every page
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7); doc.setFont("helvetica","normal");
    doc.text(`© King's Printer for Ontario — ${templateName} — Page ${i} of ${totalPages}`, pageW/2, pageH-10, {align:"center"});
    doc.text(`Generated: ${new Date().toLocaleDateString("en-CA")}`, pageW-margin, pageH-10, {align:"right"});
  }

  doc.save(`${templateName.replace(/[^a-zA-Z0-9]/g,"_")}_${new Date().toISOString().slice(0,10)}.pdf`);
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function TemplateFillModal({ templateId, templateName, caseId, onClose }: TemplateFillModalProps) {
  const { toast } = useToast();
  const [allCases, setAllCases] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState(caseId || "");
  const [fields, setFields] = useState<Record<string,string>>({});
  const [autoFilled, setAutoFilled] = useState<Set<string>>(new Set());
  const [expenses, setExpenses] = useState([{date:"",desc:"",amount:""}]);
  const [exporting, setExporting] = useState(false);

  function setField(k: string, v: string) { setFields(p => ({...p, [k]: v})); }

  // Load all cases
  useEffect(() => {
    fetch(`${API}/cases`, { headers:{Authorization:`Bearer ${tok()}`} })
      .then(r=>r.ok?r.json():[]).then(d=>setAllCases(Array.isArray(d)?d:[]));
  }, []);

  // Auto-fill from selected case
  useEffect(() => {
    if (!selectedCaseId) return;
    fetch(`${API}/cases/${selectedCaseId}`, { headers:{Authorization:`Bearer ${tok()}`} })
      .then(r=>r.ok?r.json():null).then(c => {
        if (!c) return;
        const dob = c.client?.dateOfBirth ? c.client.dateOfBirth.split("T")[0] : "";
        const doa = c.dateOfLoss ? c.dateOfLoss.split("T")[0] : "";
        const map: Record<string,string> = {
          lastName:          c.client?.lastName    || "",
          firstName:         c.client?.firstName   || "",
          address:           c.clientStreet        || c.client?.address || "",
          city:              c.clientCity          || c.client?.city    || "",
          province:          c.clientState         || c.client?.province || "ON",
          postalCode:        c.clientZip           || c.client?.postCode || "",
          dateOfBirth:       dob,
          homePhone:         c.client?.homePhone   || c.clientMobile || "",
          phone:             c.clientMobile        || c.client?.cellPhone || "",
          email:             c.client?.email       || "",
          maritalStatus:     c.client?.maritalStatus || "",
          dateOfAccident:    doa,
          fileNo:            c.fileNo              || "",
          claimNumber:       c.claimNo             || "",
          policyNumber:      c.policyNo            || "",
          referredBy:        c.referredBy          || "",
          clerkAssigned:     c.clerkAssigned       || "",
          sigName:           `${c.client?.firstName||""} ${c.client?.lastName||""}`.trim(),
          appSigName:        `${c.client?.firstName||""} ${c.client?.lastName||""}`.trim(),
          decLastName:       c.client?.lastName    || "",
          decFirstName:      c.client?.firstName   || "",
          gender:            c.client?.gender      || "",
        };
        const keys = new Set(Object.entries(map).filter(([,v])=>v!=="").map(([k])=>k));
        setFields(p => ({...p, ...Object.fromEntries(Object.entries(map).filter(([,v])=>v!==""))}));
        setAutoFilled(keys);
      });
  }, [selectedCaseId]);

  const FormComponent = FORM_MAP[templateId];

  const handleExport = async () => {
    setExporting(true);
    try {
      const allFields = { ...fields };
      if (templateId === "ocf-6") {
        expenses.forEach((e,i) => {
          allFields[`expenseDate${i}`] = e.date;
          allFields[`expenseDesc${i}`] = e.desc;
          allFields[`expenseAmt${i}`] = e.amount;
        });
      }
      await exportToPDF(allFields, templateName);
      toast({ title: "PDF exported successfully", description: templateName });
    } catch(err) {
      console.error(err);
      toast({ title: "Export failed", description: "Please try again", variant:"destructive" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto py-6 px-4">
      <div className="bg-background rounded-lg shadow-2xl w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-background z-10 rounded-t-lg">
          <div>
            <h2 className="text-base font-semibold">{templateName}</h2>
            <p className="text-xs text-muted-foreground">Government of Ontario — Complete all applicable fields</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        {/* Case pre-fill */}
        <div className="px-6 py-3 border-b bg-muted/30">
          <Label className="text-xs font-medium mb-1.5 block">Pre-fill from case (optional)</Label>
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
              <SelectTrigger className="h-9 text-sm w-80">
                <SelectValue placeholder="Select a case to auto-fill fields..." />
              </SelectTrigger>
              <SelectContent>
                {allCases.map((c:any) => (
                  <SelectItem key={c.id} value={c.id}>{c.fileNo} — {c.client?.firstName} {c.client?.lastName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {autoFilled.size > 0 && (
              <span className="text-xs bg-yellow-100 text-yellow-800 border border-yellow-200 px-2 py-1 rounded">
                {autoFilled.size} fields auto-filled
              </span>
            )}
          </div>
        </div>

        {/* Form body */}
        <div className="px-6 py-4">
          {FormComponent ? (
            templateId === "ocf-6"
              ? <FormComponent f={fields} set={setField} af={autoFilled} expenses={expenses} setExpenses={setExpenses} />
              : <FormComponent f={fields} set={setField} af={autoFilled} />
          ) : (
            <div className="text-center py-10 text-muted-foreground text-sm">Form not yet implemented.</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center gap-3 px-6 py-4 border-t sticky bottom-0 bg-background rounded-b-lg">
          <p className="text-xs text-muted-foreground">Yellow fields = auto-filled from case data. Review before exporting.</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleExport} disabled={exporting}>
              {exporting ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Generating PDF...</> : <><Download className="h-4 w-4 mr-1" />Export as PDF</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}