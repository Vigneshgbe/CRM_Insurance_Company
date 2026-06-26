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

// ── PDF generation — faithful OCF layout matching actual government templates ──
async function exportToPDF(fields: Record<string,any>, templateId: string, templateName: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"letter" });

  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const ML = 12; const MR = 12; const MT = 12;
  const CW = PW - ML - MR;
  let y = MT;

  function newPage() { doc.addPage(); y = MT; }
  function checkY(need: number) { if (y + need > PH - 14) newPage(); }
  function hLine(yy = y) { doc.setDrawColor(150); doc.setLineWidth(0.2); doc.line(ML, yy, PW-MR, yy); }

  function box(x: number, yy: number, w: number, h: number, fill = false) {
    doc.setDrawColor(80); doc.setLineWidth(0.3);
    if (fill) { doc.rect(x, yy, w, h, "F"); } else { doc.rect(x, yy, w, h); }
  }

  function chkBox(x: number, yy: number, checked: boolean) {
    doc.setDrawColor(80); doc.setLineWidth(0.3); doc.rect(x, yy-3, 3.5, 3.5);
    if (checked) { doc.setFont("helvetica","bold"); doc.setFontSize(7); doc.text("X", x+0.5, yy-0.3); }
  }

  function txt(text: string, x: number, yy: number, opts: any = {}) {
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(opts.size || 8);
    doc.setTextColor(opts.color || 0);
    if (opts.align) doc.text(String(text||""), x, yy, {align: opts.align});
    else doc.text(String(text||""), x, yy);
    doc.setTextColor(0);
  }

  function fieldBox(label: string, value: string, x: number, yy: number, w: number, h: number) {
    box(x, yy, w, h);
    doc.setFont("helvetica","normal"); doc.setFontSize(6); doc.setTextColor(90);
    doc.text(label||"", x+1, yy+3.2);
    doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(0);
    const lines = doc.splitTextToSize(String(value||""), w-2);
    if (lines.length > 0) doc.text(lines.slice(0,Math.floor((h-5)/4)), x+1, yy+7);
  }

  function partHeader(label: string, x: number, yy: number, w: number, h = 6.5) {
    doc.setFillColor(30,30,30); doc.rect(x, yy, w, h, "F");
    doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(255);
    doc.text(label||"", x+2, yy+4.3);
    doc.setTextColor(0);
  }

  function sectionBand(text: string) {
    checkY(9);
    doc.setFillColor(210,215,225); doc.rect(ML, y, CW, 6.5, "F");
    doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(10);
    doc.text(text||"", ML+2, y+4.5);
    doc.setTextColor(0); y += 7.5;
  }

  function fieldRow(items: {label:string; value:string; w:number}[], rowH = 10) {
    checkY(rowH);
    let x = ML;
    items.forEach(item => { fieldBox(item.label, item.value||"", x, y, item.w, rowH); x += item.w; });
    y += rowH;
  }

  function para(text: string, size = 7, indent = 0) {
    doc.setFont("helvetica","normal"); doc.setFontSize(size); doc.setTextColor(0);
    const lines = doc.splitTextToSize(String(text||""), CW - indent);
    lines.forEach((line: string) => { checkY(4.5); doc.text(line, ML+indent, y); y += 4; });
    y += 1;
  }

  function sigRow(labels: string[], values: string[], rowH = 13) {
    checkY(rowH);
    const w = CW / labels.length;
    labels.forEach((lbl, i) => { fieldBox(lbl, values[i]||"", ML+i*w, y, w, rowH); });
    y += rowH;
  }

  function checkRow(options: string[], valueKey: string, x: number, yy: number, spacing = 36) {
    options.forEach((opt, i) => {
      const isChecked = fields[valueKey]===opt || fields[valueKey+"_"+opt]==="Y" || fields[valueKey]===opt;
      chkBox(x+i*spacing, yy, isChecked);
      doc.setFont("helvetica","normal"); doc.setFontSize(7.5); doc.text(opt, x+i*spacing+5, yy);
    });
  }

  function addFooters(ref: string) {
    const total = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      doc.setFont("helvetica","normal"); doc.setFontSize(6.5); doc.setTextColor(100);
      doc.text(`${ref}`, ML, PH-6);
      doc.text(`Page ${i} of ${total}`, PW-MR, PH-6, {align:"right"});
      doc.text(`Generated: ${new Date().toLocaleDateString("en-CA")}`, PW/2, PH-6, {align:"center"});
      doc.setTextColor(0);
    }
  }

  const F = (k: string) => String(fields[k]||"");
  const C = (k: string) => fields[k]==="Y"||fields[k]==="Yes"||fields[k]===true;

  // ── OCF-1 ──────────────────────────────────────────────────────────────────
  if (templateId==="ocf-1") {
    const hbX=PW-MR-58;
    txt("Application for Accident Benefits", ML, MT+6, {bold:true,size:13});
    txt("OCF-1  |  AF-145E (2026)  |  © King's Printer for Ontario", ML, MT+10.5, {size:7});
    fieldBox("Claim Number", F("claimNumber"), hbX, MT, 58, 8);
    fieldBox("Policy Number", F("policyNumber"), hbX, MT+8, 58, 8);
    fieldBox("Date of Accident (yyyy/mm/dd)", F("dateOfAccident"), hbX, MT+16, 58, 8);
    y=MT+28; hLine(); y+=3;

    partHeader("Part 1 — Applicant Information", ML, y, CW); y+=7;
    fieldRow([{label:"First Name",value:F("firstName"),w:50},{label:"Last Name",value:F("lastName"),w:50},{label:"Date of Birth (yyyy/mm/dd)",value:F("dateOfBirth"),w:50},{label:"Driver's Licence Number",value:F("driverLicence"),w:CW-150}]);
    fieldRow([{label:"Street Address",value:F("address"),w:CW}]);
    fieldRow([{label:"City",value:F("city"),w:60},{label:"Province",value:F("province"),w:28},{label:"Postal Code",value:F("postalCode"),w:35},{label:"Phone Number",value:F("phone"),w:CW-123}]);
    fieldRow([{label:"E-mail Address",value:F("email"),w:70},{label:"Gender",value:F("gender"),w:28},{label:"Languages Used",value:F("languages"),w:CW-98}]);
    checkY(10); txt("Marital Status:", ML, y+4, {size:7.5,bold:true});
    ["Separated","Common-Law","Married","Single","Divorced","Widow(er)"].forEach((s,i)=>{chkBox(ML+32+i*28,y+4,F("maritalStatus")===s);txt(s,ML+37+i*28,y+4,{size:7});});
    y+=7;
    txt("Consent to electronic communication if offered by insurer?", ML, y, {size:7.5});
    chkBox(ML+108,y,F("electronicConsent")==="Yes"); txt("Yes",ML+113,y,{size:7.5});
    chkBox(ML+126,y,F("electronicConsent")==="No"); txt("No",ML+131,y,{size:7.5}); y+=8;

    partHeader("Part 2 — Policy Details", ML, y, CW); y+=7;
    txt("Relationship to the policyholder (Select all that apply):", ML, y, {size:7.5,bold:true}); y+=5;
    const rels=[["I am the Policyholder","rel_I am the Policyholder"],["Spouse of Policyholder","rel_Spouse of Policyholder"],["Listed Driver","rel_Listed Driver"],["Employee of the Policyholder","rel_Employee of the Policyholder"],["Vehicle rented/leased 30+ days","rel_Vehicle rented/leased 30+ days"],["Dependent of Policyholder/spouse","rel_Dependent of the Policyholder/spouse"],["No relationship to the Policyholder","rel_No relationship to the Policyholder"]];
    rels.forEach(([lbl,k],i)=>{const xi=ML+(i%2)*98;chkBox(xi,y+(i%2===0&&i>0?0:0),C(k));txt(lbl,xi+5,y+(i%2===0&&i>0?0:0),{size:7});if(i%2===1||i===rels.length-1)y+=5.5;});
    y+=3;
    txt("Aware of coverage under any other automobile policies?", ML, y, {size:7.5});
    checkRow(["Yes","No","I don't know"],"otherCoverage",ML+100,y,20); y+=7;
    txt("How were you involved in the accident? (Select all that apply)", ML, y, {size:7.5,bold:true}); y+=5;
    [["Driver of Vehicle Insured under this Policy","inv_Driver of Vehicle Insured under this Policy"],["Passenger of Vehicle Insured under this Policy","inv_Passenger of Vehicle Insured under this Policy"],["Pedestrian or Cyclist","inv_Pedestrian or Cyclist"],["Driver/Passenger of vehicle not insured under this Policy","inv_Driver/Passenger of vehicle NOT insured under this Policy"]].forEach(([lbl,k],i)=>{const xi=ML+(i%2)*98;chkBox(xi,y,C(k));txt(lbl,xi+5,y,{size:7});if(i%2===1)y+=5.5;});
    y+=7;

    partHeader("Part 3 — Accident Details", ML, y, CW); y+=7;
    fieldRow([{label:"Location of Accident (Intersection, City, Province/State)",value:F("accidentLocation"),w:110},{label:"Date (yyyy/mm/dd)",value:F("dateOfAccident"),w:45},{label:"Time",value:F("timeOfAccident"),w:CW-155}]);
    checkY(18); box(ML,y,CW,18); txt("Brief description of accident and all injuries sustained as a result of the accident:",ML+1,y+4,{size:6.5,bold:true});
    const descLines=doc.splitTextToSize(F("accidentDescription"),CW-3);
    doc.setFont("helvetica","normal");doc.setFontSize(7.5);doc.text(descLines.slice(0,3),ML+1,y+9);y+=19;
    txt("Select all that apply:", ML, y, {size:7.5,bold:true}); y+=5;
    [["Collision reporting centre","resp_Went to collision reporting centre"],["Police attended","resp_Police attended"],["Ambulance attended","resp_Ambulance attended"],["Went to the hospital","resp_Went to the hospital"],["Went to doctor/HCP","resp_Went to doctor/nurse practitioner/other Regulated Healthcare Provider"]].forEach(([lbl,k],i)=>{chkBox(ML+i*38,y,C(k));txt(lbl,ML+i*38+5,y,{size:6.5});});
    y+=7;
    txt("Were you charged?",ML,y,{size:7.5});chkBox(ML+37,y,F("wereYouCharged")==="Yes");txt("Yes",ML+42,y,{size:7.5});chkBox(ML+54,y,F("wereYouCharged")==="No");txt("No",ML+59,y,{size:7.5});
    if(F("chargeDetails")){txt("If yes, list charge:",ML+68,y,{size:7});txt(F("chargeDetails"),ML+95,y,{size:7.5});}y+=5.5;
    txt("Accident happen while working?",ML,y,{size:7.5});chkBox(ML+62,y,F("accidentAtWork")==="Yes");txt("Yes",ML+67,y,{size:7.5});chkBox(ML+78,y,F("accidentAtWork")==="No");txt("No",ML+83,y,{size:7.5});y+=5.5;
    txt("Accident happen while travelling to/from work?",ML,y,{size:7.5});chkBox(ML+90,y,F("accidentCommute")==="Yes");txt("Yes",ML+95,y,{size:7.5});chkBox(ML+106,y,F("accidentCommute")==="No");txt("No",ML+111,y,{size:7.5});y+=8;

    partHeader("Part 4 — Applicant Status", ML, y, CW); y+=7;
    const statuses=[["statusFullTime","Working Full-Time"],["statusPartTime","Working Part-Time"],["statusSelfEmployed","Self-Employed"],["statusUnemployed","Unemployed"],["statusEI","Receiving Employment Insurance"],["statusRetired","Retired"],["statusStudent","Student"],["statusCaregiver","Caregiver"],["status26Weeks","Worked 26 weeks in past 52"],["statusWSIB","Receiving WSIB Benefits"]];
    statuses.forEach(([k,lbl],i)=>{const xi=ML+(i%3)*65;checkY(5.5);chkBox(xi,y,C(k));txt(lbl,xi+5,y,{size:7});if(i%3===2)y+=5.5;});
    y+=7;
    [["missedActivities","returnedActivities","Missed time from pre-accident activities"],["missedWork","returnedWork","Missed time from work"],["missedSchool","returnedSchool","Missed time from school"]].forEach(([k,dk,lbl])=>{
      checkY(7);txt(lbl,ML,y,{size:7.5});checkRow(["Yes","No","N/A"],k,ML+80,y,16);
      if(F(k)==="Yes"){txt("Date returned:",ML+135,y,{size:7});txt(F(dk as string),ML+158,y,{size:7.5});}y+=6;
    });

    partHeader("Part 5 — Other Insurance", ML, y, CW); y+=7;
    txt("Do you have any other benefit plan that covers you?",ML,y,{size:7.5});checkRow(["Yes","No"],"hasOtherBenefits",ML+100,y,18);y+=6;
    if(F("otherBenefitDetails")){fieldRow([{label:"Name of benefit companies and policy number(s)",value:F("otherBenefitDetails"),w:CW}]);}
    txt("Type of Coverage:",ML,y,{size:7.5,bold:true});["Medical","Dental","Short Term Disability","Long Term Disability","Other"].forEach((t,i)=>{chkBox(ML+35+i*35,y,C(`cov_${t}`));txt(t,ML+40+i*35,y,{size:7});});y+=8;

    partHeader("Part 6 — Authorization for Direct Payment", ML, y, CW); y+=7;
    para("I direct the insurer, including the Motor Vehicle Accident Claims Fund, to pay the licensed service provider directly for that portion of the approved goods and services specified in separate forms Treatment Confirmation Form (OCF-23) and Treatment and Assessment Plan (OCF-18), that are not covered by extended/supplementary health insurance.",7);
    fieldRow([{label:"Initials of Applicant or Substitute Decision Maker",value:F("part6Initials"),w:70}]);

    partHeader("Part 7 — Signatures & Certification", ML, y, CW); y+=7;
    para("I certify that the information provided is true and correct. I understand that it is an offence under the Insurance Act to knowingly make a false or misleading statement or representation to an insurer under a contract of insurance.",7);
    sigRow(["Name of Applicant or Substitute Decision Maker","Signature of Applicant or Substitute Decision Maker","Date Signed (yyyy/mm/dd)"],[F("sigName"),F("signature"),F("dateSigned")]);

  // ── OCF-2 ──────────────────────────────────────────────────────────────────
  } else if (templateId==="ocf-2") {
    const hbX=PW-MR-58;
    txt("Employer's Confirmation Form (OCF-2)",ML,MT+6,{bold:true,size:12});
    txt("AF-085E (2026)  |  © King's Printer for Ontario",ML,MT+10.5,{size:7});
    fieldBox("Claim Number",F("claimNumber"),hbX,MT,58,8);
    fieldBox("Policy Number",F("policyNumber"),hbX,MT+8,58,8);
    fieldBox("Date of Accident",F("dateOfAccident"),hbX,MT+16,58,8);
    y=MT+28; hLine(); y+=3;
    partHeader("Part 1 — Applicant Information",ML,y,CW);y+=7;
    fieldRow([{label:"Last Name",value:F("lastName"),w:55},{label:"First Name",value:F("firstName"),w:55},{label:"Gender",value:F("gender"),w:CW-110}]);
    fieldRow([{label:"Street Address",value:F("address"),w:CW}]);
    fieldRow([{label:"City",value:F("city"),w:60},{label:"Province",value:F("province"),w:28},{label:"Postal Code",value:F("postalCode"),w:CW-88}]);
    fieldRow([{label:"Date of Birth",value:F("dateOfBirth"),w:CW/3},{label:"Home Telephone",value:F("homePhone"),w:CW/3},{label:"Work Telephone",value:F("workPhone"),w:CW/3}]);
    fieldRow([{label:"Insurance Company Name",value:F("insurerName"),w:CW*0.6},{label:"Policy Holder",value:F("policyHolderName")||"",w:CW*0.2},{label:"Policy Number",value:F("policyNumber"),w:CW*0.2}]);
    partHeader("Part 2 — Authorization",ML,y,CW);y+=7;
    para("I authorize my employer to disclose to my insurance company or its authorized representative, any relevant information about my employment, including copies of relevant documents directly relating to my application for income replacement benefits.",7);
    sigRow(["Name of Applicant or Substitute Decision Maker","Signature","Date (YYYYMMDD)"],[F("sigName"),F("signature"),F("dateSigned")]);
    partHeader("Part 3 — Salary Period",ML,y,CW);y+=7;
    txt("Employed — period to use:",ML,y,{size:7.5,bold:true});chkBox(ML+55,y,C("period4Wks"));txt("4 weeks",ML+60,y,{size:7.5});chkBox(ML+82,y,C("period52Wks"));txt("52 weeks",ML+87,y,{size:7.5});y+=6;
    txt("Self-Employed period:",ML,y,{size:7.5,bold:true});chkBox(ML+40,y,C("selfEmp52Wks"));txt("52 weeks",ML+45,y,{size:7.5});chkBox(ML+70,y,C("selfEmpFiscal"));txt("Last complete fiscal year",ML+75,y,{size:7.5});y+=6;
    fieldRow([{label:"From (yyyy/mm/dd)",value:F("selfEmpFrom"),w:CW/2},{label:"To (yyyy/mm/dd)",value:F("selfEmpTo"),w:CW/2}]);
    partHeader("Part 4 — Applicant's Income (completed by employer)",ML,y,CW);y+=7;
    fieldRow([{label:"Week 1",value:F("grossWeek1"),w:CW/5},{label:"Week 2",value:F("grossWeek2"),w:CW/5},{label:"Week 3",value:F("grossWeek3"),w:CW/5},{label:"Week 4",value:F("grossWeek4"),w:CW/5},{label:"Weeks Worked",value:F("weeksWorked"),w:CW/5}]);
    fieldRow([{label:"Gross Last 4 Weeks ($)",value:F("grossLast4Wks"),w:CW/3},{label:"Gross Last 52 Weeks ($)",value:F("grossLast52Wks"),w:CW/3},{label:"Self-Employed Gross ($)",value:F("selfEmpGross"),w:CW/3}]);
    fieldRow([{label:"Salary",value:F("salary"),w:CW/3},{label:"Tips/Commissions",value:F("tips"),w:CW/3},{label:"Total",value:F("incomeTotal"),w:CW/3}]);
    partHeader("Part 5 — Other Benefits",ML,y,CW);y+=7;
    [["incomeContinuation","Income Continuation Benefit (short/long-term disability)"],["suppMedical","Supplementary Medical/Rehabilitation Benefits"],["sickLeave","Sick Leave"]].forEach(([k,lbl])=>{txt(lbl,ML,y,{size:7.5});checkRow(["Yes","No"],k,ML+90,y,18);y+=5;if(F(k)==="Yes"){fieldRow([{label:"Insurance Company",value:F(`${k}Insurer`),w:CW/2},{label:"Policy No.",value:F(`${k}Policy`),w:CW/2}]);}});
    txt("Union member?",ML,y,{size:7.5});checkRow(["Yes","No"],"unionMember",ML+32,y,18);txt("CPP contributor?",ML+72,y,{size:7.5});checkRow(["Yes","No"],"cppContributor",ML+104,y,18);txt("WSIB claim?",ML+145,y,{size:7.5});checkRow(["Yes","No"],"wsibClaim",ML+170,y,18);y+=8;
    partHeader("Part 6 — Employment Details",ML,y,CW);y+=7;
    fieldRow([{label:"Employment From",value:F("employedFrom"),w:CW/3},{label:"Employment To",value:F("employedTo"),w:CW/3},{label:"Latest Job Title",value:F("jobTitle"),w:CW/3}]);
    fieldRow([{label:"Last Date Worked",value:F("lastDateWorked"),w:CW/2},{label:"Date of Return to Work",value:F("returnToWork"),w:CW/2}]);
    checkY(14);box(ML,y,CW,14);txt("Brief Job Description:",ML+1,y+4,{size:6.5,bold:true});doc.setFont("helvetica","normal");doc.setFontSize(7.5);doc.text(doc.splitTextToSize(F("jobDescription"),CW-3).slice(0,2),ML+1,y+8);y+=15;
    txt("Type:",ML,y,{size:7.5,bold:true});["Full-time","Part-time","Casual","Seasonal"].forEach((t,i)=>{chkBox(ML+15+i*33,y,C(`empType_${t}`));txt(t,ML+20+i*33,y,{size:7.5});});y+=8;
    partHeader("Part 7 — Employer Information",ML,y,CW);y+=7;
    fieldRow([{label:"Company Name",value:F("employerCompany"),w:CW/2},{label:"Contact Person",value:F("employerContact"),w:CW/2}]);
    fieldRow([{label:"Address",value:F("employerAddress"),w:CW/2},{label:"Tax Reg # / BIN",value:F("employerBIN"),w:CW/2}]);
    fieldRow([{label:"City",value:F("employerCity"),w:CW/3},{label:"Province",value:F("employerProvince"),w:CW/3},{label:"Postal Code",value:F("employerPC"),w:CW/3}]);
    fieldRow([{label:"Telephone",value:F("employerPhone"),w:CW/2},{label:"Fax",value:F("employerFax"),w:CW/2}]);
    partHeader("Part 8 — Employer Signature",ML,y,CW);y+=7;
    sigRow(["Employer Signature","Date (YYYYMMDD)"],[F("empSig"),F("empSigDate")],13);
    fieldRow([{label:"Employer Name (please print)",value:F("empSigName"),w:CW/2},{label:"Title",value:F("empTitle")||"",w:CW/2}]);

  // ── OCF-5 ──────────────────────────────────────────────────────────────────
  } else if (templateId==="ocf-5") {
    const hbX=PW-MR-58;
    txt("Permission to Disclose Health Information (OCF-5)",ML,MT+6,{bold:true,size:11});
    txt("AF-124E (2025)  |  © King's Printer for Ontario",ML,MT+10.5,{size:7});
    fieldBox("Claim Number",F("claimNumber"),hbX,MT,58,8);
    fieldBox("Policy Number",F("policyNumber"),hbX,MT+8,58,8);
    fieldBox("Date of Accident (yyyy/mm/dd)",F("dateOfAccident"),hbX,MT+16,58,8);
    y=MT+28; hLine();y+=3;
    partHeader("Part 1 — Applicant Information",ML,y,CW);y+=7;
    fieldRow([{label:"Last Name",value:F("lastName"),w:55},{label:"First Name and Initial",value:F("firstName"),w:55},{label:"Date of Accident",value:F("dateOfAccident"),w:CW-110}]);
    fieldRow([{label:"Street Address",value:F("address"),w:CW}]);
    fieldRow([{label:"City/Town",value:F("city"),w:60},{label:"Province",value:F("province"),w:28},{label:"Postal Code",value:F("postalCode"),w:CW-88}]);
    fieldRow([{label:"Date of Birth",value:F("dateOfBirth"),w:CW/3},{label:"Home Telephone",value:F("homePhone"),w:CW/3},{label:"Work Telephone + Ext",value:F("workPhone"),w:CW/3}]);
    partHeader("Part 2 — Insurance Company Information",ML,y,CW);y+=7;
    fieldRow([{label:"Insurance Company Name",value:F("insurerName"),w:CW*0.6},{label:"Representative Name",value:F("insurerRep")||"",w:CW*0.4}]);
    fieldRow([{label:"Street Address",value:F("insurerAddress")||"",w:CW}]);
    fieldRow([{label:"City/Town",value:F("insurerCity"),w:60},{label:"Province",value:F("insurerProvince")||"",w:28},{label:"Postal Code",value:F("insurerPostalCode")||"",w:CW-88}]);
    fieldRow([{label:"Telephone",value:F("insurerPhone")||"",w:CW/2},{label:"Fax",value:F("insurerFax")||"",w:CW/2}]);
    partHeader("Part 3 — Treating Health Professional",ML,y,CW);y+=7;
    fieldRow([{label:"Name of Health Professional",value:F("hpName"),w:CW/2},{label:"Health Profession",value:F("hpProfession"),w:CW/2}]);
    fieldRow([{label:"Street Address",value:F("hpAddress"),w:CW}]);
    fieldRow([{label:"City/Town",value:F("hpCity"),w:60},{label:"Province",value:F("hpProvince"),w:28},{label:"Postal Code",value:F("hpPostalCode"),w:CW-88}]);
    fieldRow([{label:"Telephone",value:F("hpPhone"),w:CW/2},{label:"Fax",value:F("hpFax"),w:CW/2}]);
    partHeader("Part 4 — Applicant Signature",ML,y,CW);y+=7;
    para("I authorize my treating health professional to collect, use and disclose to my insurer only such information relating to my health condition and treatment received as a result of the automobile accident and any pre-existing or subsequently occurring health conditions that may be a barrier to my recovery, as is reasonably required for the purpose of providing treatment and determining my eligibility for benefits. This authorization is valid until my claim for Statutory Accident Benefits has been concluded or until I withdraw this consent.",7);
    sigRow(["Name of Applicant or Substitute Decision Maker (please print)","Signature of Applicant or Substitute Decision Maker","Date (YYYYMMDD)"],[F("sigName"),F("signature"),F("dateSigned")]);

  // ── OCF-6 ──────────────────────────────────────────────────────────────────
  } else if (templateId==="ocf-6") {
    const hbX=PW-MR-58;
    txt("Expenses Claim Form (OCF-6)",ML,MT+6,{bold:true,size:12});
    txt("AF-126E (2026)  |  © King's Printer for Ontario",ML,MT+10.5,{size:7});
    fieldBox("Claim Number",F("claimNumber"),hbX,MT,58,8);
    fieldBox("Policy Number",F("policyNumber"),hbX,MT+8,58,8);
    fieldBox("Date of Accident (yyyy/mm/dd)",F("dateOfAccident"),hbX,MT+16,58,8);
    y=MT+28; hLine();y+=3;
    para("Only use this form to claim expenses not submitted on your behalf by your health care provider. You may be eligible for reasonable and necessary expenses incurred because of the accident.",7);
    y+=2;
    partHeader("Part 1 — Applicant Information",ML,y,CW);y+=7;
    fieldRow([{label:"Last Name",value:F("lastName"),w:55},{label:"First Name and Initial",value:F("firstName"),w:55},{label:"Gender",value:F("gender"),w:CW-110}]);
    fieldRow([{label:"Street Address",value:F("address"),w:CW}]);
    fieldRow([{label:"City/Town",value:F("city"),w:60},{label:"Province",value:F("province"),w:28},{label:"Postal Code",value:F("postalCode"),w:CW-88}]);
    fieldRow([{label:"Date of Birth (yyyy/mm/dd)",value:F("dateOfBirth"),w:CW/3},{label:"Home Telephone",value:F("homePhone"),w:CW/3},{label:"Work Telephone + Ext",value:F("workPhone"),w:CW/3}]);
    partHeader("Part 2 — Expenses",ML,y,CW);y+=7;
    // Table header
    const colW=[14,28,CW-57,15];
    let hx=ML; doc.setFillColor(190,195,205);
    ["Item","Date","Description of Goods and Services and Name of Service Provider","Amount"].forEach((h,i)=>{doc.rect(hx,y,colW[i],6.5,"F");doc.setFont("helvetica","bold");doc.setFontSize(6.5);doc.text(h,hx+1,y+4.3);hx+=colW[i];});
    y+=6.5;
    let total=0;
    for(let r=0;r<10;r++){
      const date=fields[`expenseDate${r}`]||""; const desc=fields[`expenseDesc${r}`]||""; const amt=parseFloat(fields[`expenseAmt${r}`]||"0")||0;
      if(!date&&!desc&&!amt&&r>=3) break;
      checkY(8); total+=amt; let rx=ML;
      colW.forEach((w,ci)=>{
        box(rx,y,w,8);
        doc.setFont("helvetica","normal");doc.setFontSize(7.5);
        const v=ci===0?String(r+1):ci===1?date:ci===2?desc:(amt?`$${amt.toFixed(2)}`:"");
        doc.text(doc.splitTextToSize(v,w-2).slice(0,1),rx+1,y+5.2);
        rx+=w;
      });y+=8;
    }
    // Total row
    checkY(8);let tx=ML;
    colW.forEach((w,i)=>{box(tx,y,w,8);if(i===colW.length-1){doc.setFont("helvetica","bold");doc.setFontSize(7.5);doc.text(`$${total.toFixed(2)}`,tx+1,y+5.2);}else if(i===colW.length-2){doc.setFont("helvetica","bold");doc.setFontSize(7);doc.text("Total Amount",tx+1,y+5.2);}else{doc.setFont("helvetica","normal");}tx+=w;});y+=9;
    partHeader("Part 3 — Signature",ML,y,CW);y+=7;
    para("I certify that the information provided is true and correct.",7);
    sigRow(["Name of Applicant or Substitute Decision Maker (please print)","Signature of Applicant or Substitute Decision Maker","Date (yyyy/mm/dd)"],[F("sigName"),F("signature"),F("dateSigned")]);

  // ── OCF-10 ─────────────────────────────────────────────────────────────────
  } else if (templateId==="ocf-10") {
    const hbX=PW-MR-58;
    txt("Election of Income Replacement, Non-Earner or Caregiver Benefit (OCF-10)",ML,MT+6,{bold:true,size:10.5});
    txt("AF-128E (2026)  |  © King's Printer for Ontario",ML,MT+11,{size:7});
    fieldBox("Claim Number",F("claimNumber"),hbX,MT,58,8);
    fieldBox("Policy Number",F("policyNumber"),hbX,MT+8,58,8);
    fieldBox("Date of Accident",F("dateOfAccident"),hbX,MT+16,58,8);
    y=MT+28; hLine();y+=3;
    para("Although you may be eligible for the Income Replacement Benefit, Non-Earner Benefit and/or the Caregiver Benefit, you can only receive one of these benefits. You must choose which benefit you wish to receive. Please note that your choice of benefits cannot be changed after this form has been submitted to the insurance company unless the injury is determined to be catastrophic. If you need help in choosing the benefit, please contact your insurance company representative immediately. Return this form no later than 30 days from the day you received it.",8);
    y+=4;
    partHeader("Part 1 — Applicant Information",ML,y,CW);y+=7;
    fieldRow([{label:"Last Name",value:F("lastName"),w:55},{label:"First Name and Initial",value:F("firstName"),w:55},{label:"Gender",value:F("gender"),w:CW-110}]);
    fieldRow([{label:"Street Address",value:F("address"),w:CW}]);
    fieldRow([{label:"City/Town",value:F("city"),w:60},{label:"Province",value:F("province"),w:28},{label:"Postal Code",value:F("postalCode"),w:CW-88}]);
    fieldRow([{label:"Date of Birth (yyyy/mm/dd)",value:F("dateOfBirth"),w:CW/3},{label:"Home Telephone",value:F("homePhone"),w:CW/3},{label:"Work Telephone + Ext",value:F("workPhone"),w:CW/3}]);
    partHeader("Part 2 — Benefit Election",ML,y,CW);y+=10;
    txt("I choose to receive the following benefit:",ML,y,{size:9,bold:true});y+=9;
    const bens=["Income Replacement Benefit","Non-Earner Benefit","Caregiver Benefit"];
    const bW=CW/3;
    bens.forEach((b,i)=>{
      const bx=ML+i*bW; checkY(16);
      box(bx+2,y,bW-4,16);
      chkBox(bx+8,y+10,F("benefitElection")===b);
      doc.setFont("helvetica",F("benefitElection")===b?"bold":"normal"); doc.setFontSize(8.5);
      const bl=doc.splitTextToSize(b,bW-18);
      doc.text(bl,bx+14,y+7);
    });
    y+=20;
    partHeader("Part 3 — Signature",ML,y,CW);y+=7;
    para("I certify that the information provided is true and correct. I understand that it is an offence under the Insurance Act to knowingly make a false or misleading statement or representation to my insurer under a contract of insurance.",7);
    sigRow(["Name of Applicant or Substitute Decision Maker (please print)","Signature of Applicant or Substitute Decision Maker","Date (yyyy/mm/dd)"],[F("sigName"),F("signature"),F("dateSigned")]);

  // ── Generic structured layout for OCF-3, 4, 18, 19, 23 + matrix-intake ────
  } else {
    const formRefs:Record<string,string>={
      "ocf-3":"AF-125E (2026)","ocf-4":"AF-086E (2026)","ocf-18":"AF-119E (2026)",
      "ocf-19":"AF-144E (2026)","ocf-23":"AF-120E (2026)","matrix-intake":"Matrix Legal Services Professional Corporation",
    };
    const ref=formRefs[templateId]||"Government of Ontario";
    txt(templateName,PW/2,MT+6,{bold:true,size:12,align:"center"});
    txt(ref,PW/2,MT+11,{size:7,align:"center"});
    hLine(MT+14);y=MT+19;

    if(templateId!=="matrix-intake"){
      fieldRow([{label:"Claim Number",value:F("claimNumber"),w:CW/3},{label:"Policy Number",value:F("policyNumber"),w:CW/3},{label:"Date of Accident (yyyy/mm/dd)",value:F("dateOfAccident"),w:CW/3}]);
    }

    // Applicant block
    sectionBand("Applicant Information");
    fieldRow([{label:"Last Name",value:F("lastName"),w:55},{label:"First Name",value:F("firstName"),w:55},{label:"Date of Birth",value:F("dateOfBirth"),w:40},{label:"Gender",value:F("gender"),w:CW-150}]);
    fieldRow([{label:"Address",value:F("address"),w:CW}]);
    fieldRow([{label:"City",value:F("city"),w:60},{label:"Province",value:F("province"),w:28},{label:"Postal Code",value:F("postalCode"),w:CW-88}]);
    fieldRow([{label:"Telephone",value:F("phone")||F("homePhone"),w:CW/2},{label:"Email",value:F("email"),w:CW/2}]);

    // OCF-4 deceased info
    if(templateId==="ocf-4"){
      sectionBand("Part 1 — Deceased's Information");
      fieldRow([{label:"Deceased's Last Name",value:F("decLastName"),w:CW/2},{label:"Deceased's First Name and Initial",value:F("decFirstName"),w:CW/2}]);
      fieldRow([{label:"Birth Date (yyyy/mm/dd)",value:F("decDOB"),w:CW/3},{label:"Date of Accident (yyyy/mm/dd)",value:F("dateOfAccident"),w:CW/3},{label:"Date of Death (yyyy/mm/dd)",value:F("dateOfDeath"),w:CW/3}]);
      txt("Marital Status:",ML,y,{size:7.5,bold:true});checkRow(["Single","Married","Common-Law","Separated","Divorced","Widow(er)"],"decMaritalStatus",ML+35,y,28);y+=7;
      txt("Dependants at time of death?",ML,y,{size:7.5});checkRow(["No","Yes"],"decHadDependants",ML+58,y,20);if(F("decHadDependants")==="Yes"){txt("How many?",ML+102,y,{size:7.5});txt(F("decDependantsCount"),ML+123,y,{size:7.5});}y+=7;
      [1,2,3].forEach(n=>{
        sectionBand(`Survivor ${n}`);
        fieldRow([{label:"Last Name",value:F(`surv${n}Last`),w:CW/2},{label:"First Name and Initial",value:F(`surv${n}First`),w:CW/2}]);
        fieldRow([{label:"Home Telephone",value:F(`surv${n}HomePhone`),w:CW/3},{label:"Work Telephone",value:F(`surv${n}WorkPhone`),w:CW/3},{label:"Fax",value:F(`surv${n}Fax`),w:CW/3}]);
      });
      sectionBand("Part 3 — Funeral Expenses");
      ["0","1","2","3","4"].forEach(i=>{fieldRow([{label:"Date",value:F(`funeralDate${i}`),w:30},{label:"Description of Service / Supplier",value:F(`funeralDesc${i}`),w:CW-50},{label:"Amount",value:F(`funeralAmt${i}`),w:20}]);});
      fieldRow([{label:"Total Payment Requested",value:F("funeralTotal"),w:CW/2}]);
    }

    // Insurance block for OCF-3, 18, 23
    if(["ocf-3","ocf-18","ocf-23"].includes(templateId)){
      sectionBand("Insurance Company Information");
      fieldRow([{label:"Insurance Company Name",value:F("insurerName"),w:CW*0.6},{label:"City/Branch",value:F("insurerCity"),w:CW*0.4}]);
      if(F("adjusterLast")||F("adjusterFirst")){
        fieldRow([{label:"Adjuster Last Name",value:F("adjusterLast"),w:CW/3},{label:"Adjuster First Name",value:F("adjusterFirst"),w:CW/3},{label:"Adjuster Telephone",value:F("adjusterPhone"),w:CW/3}]);
      }
      fieldRow([{label:"Policy Holder",value:F("policyHolderLast")+" "+F("policyHolderFirst"),w:CW/2},{label:"Policy Number",value:F("policyNumber"),w:CW/2}]);
    }

    // Injury table for OCF-3, 18, 23
    if(["ocf-3","ocf-18","ocf-23"].includes(templateId)){
      sectionBand("Injury and Sequelae Information");
      let hxI=ML;[CW*0.72,CW*0.28].forEach((w,i)=>{box(hxI,y,w,6.5);txt(i===0?"Injury Description (most significant first)":"ICD-10-CA Code",hxI+1,y+4.3,{size:7,bold:true});hxI+=w;});y+=6.5;
      for(let i=0;i<4;i++){let rx=ML;[CW*0.72,CW*0.28].forEach((w,ci)=>{box(rx,y,w,9);doc.setFont("helvetica","normal");doc.setFontSize(7.5);doc.text(fields[ci===0?`injuryDesc${i}`:`injuryCode${i}`]||"",rx+1,y+5.5);rx+=w;});y+=9;}
    }

    // OCF-3 specific disability section
    if(templateId==="ocf-3"){
      sectionBand("Part 3 — Accident Description");
      checkY(20);box(ML,y,CW,20);doc.setFont("helvetica","normal");doc.setFontSize(7.5);doc.text(doc.splitTextToSize(F("accidentDescription"),CW-3).slice(0,4),ML+1,y+5);y+=21;
      sectionBand("Part 6 — Disability Tests");
      ["symptomsDate","mostRecentExamDate","firstPostExamDate"].forEach(k=>{fieldRow([{label:k.replace(/([A-Z])/g," $1").trim(),value:F(k),w:CW/2}]);});
      fieldRow([{label:"Anticipated Duration",value:["duration_1-4 weeks","duration_5-8 weeks","duration_9-12 weeks","duration_more than 12 weeks"].filter(k=>C(k)).map(k=>k.replace("duration_","")).join(", "),w:CW}]);
    }

    // OCF-18 activity limitations
    if(templateId==="ocf-18"){
      sectionBand("Part 8 — Activity Limitations");
      fieldRow([{label:"Employment tasks",value:F("actEmployment"),w:CW/2},{label:"Activities of normal life",value:F("actNormalLife"),w:CW/2}]);
      if(F("actLimitedDesc")){checkY(15);box(ML,y,CW,15);doc.setFont("helvetica","normal");doc.setFontSize(7.5);doc.text(doc.splitTextToSize(F("actLimitedDesc"),CW-3).slice(0,3),ML+1,y+5);y+=16;}
      sectionBand("Part 9 — Plan Goals");
      const goalI=["goal1_Pain reduction","goal1_Increased range of motion","goal1_Increase in strength"].filter(k=>C(k)).map(k=>k.replace("goal1_","")).join(", ");
      const goalII=["goal2_Return to activities of normal living","goal2_Return to pre-accident work activities","goal2_Return to modified work activities"].filter(k=>C(k)).map(k=>k.replace("goal2_","")).join(", ");
      if(goalI)fieldRow([{label:"Impairment goals",value:goalI,w:CW}]);
      if(goalII)fieldRow([{label:"Functional goals",value:goalII,w:CW}]);
    }

    // OCF-19 criteria
    if(templateId==="ocf-19"){
      sectionBand("Part 3 — Catastrophic Impairment Criteria");
      [["critB1","Paraplegia or Tetraplegia"],["critB2","Severe impairment of ambulatory mobility or use of arm/amputation"],["critB3","Loss of Vision of Both Eyes"],["critB4","Traumatic Brain Injury (18 years of age or older)"],["critB5","Traumatic Brain Injury (under 18 years of age)"],["critB6","Physical impairment resulting in 55% or more whole person impairment"],["critB7","Mental/Behavioural impairment + physical resulting in 55%+ whole person"],["critB8","Class 4 (marked) in 3+ areas or Class 5 (extreme) in 1+ areas of function"]].forEach(([k,lbl])=>{checkY(6.5);chkBox(ML,y,C(k));txt(lbl as string,ML+6,y,{size:7.5});y+=5.5;});
    }

    // OCF-23 specific
    if(templateId==="ocf-23"){
      sectionBand("Part 6 — Prior and Concurrent Conditions");
      txt("a) Employed at time of accident?",ML,y,{size:7.5});checkRow(["Yes","No"],"employedAtAccident",ML+65,y,18);y+=6;
      txt("b) Prior disease/condition affecting treatment response?",ML,y,{size:7.5});checkRow(["No","Unknown","Yes"],"priorCondition23",ML+100,y,20);y+=7;
      sectionBand("Part 7 — Barriers to Recovery");
      txt("Barriers to recovery identified?",ML,y,{size:7.5});checkRow(["No","Yes"],"barriers23",ML+68,y,18);y+=7;
    }

    // Matrix intake specifics
    if(templateId==="matrix-intake"){
      sectionBand("Initial Interview Header");
      fieldRow([{label:"File No.",value:F("fileNo"),w:40},{label:"Date of MVA",value:F("dateOfMVA"),w:40},{label:"Interviewed By",value:F("interviewedBy"),w:60},{label:"Referred By",value:F("referredBy"),w:CW-140}]);
      fieldRow([{label:"Conflict Checked?",value:F("conflictChecked"),w:CW/3},{label:"Conflict Find?",value:F("conflictFind"),w:CW/3},{label:"Percent (%)",value:F("percent"),w:CW/3}]);
      fieldRow([{label:"Marital Status",value:F("maritalStatus"),w:CW/2},{label:"Benefit Choice",value:F("benefitChoice"),w:CW/2}]);
      sectionBand("Accident Details");
      fieldRow([{label:"Street Name",value:F("accidentStreet"),w:CW/2},{label:"Major Intersection",value:F("accidentIntersection"),w:CW/2}]);
      fieldRow([{label:"City",value:F("accidentCity"),w:CW/3},{label:"Province",value:F("accidentProvince"),w:CW/3},{label:"Time of M.V.A.",value:F("timeOfMVA"),w:CW/3}]);
      checkY(18);box(ML,y,CW,18);txt("Description:",ML+1,y+4,{size:6.5,bold:true});doc.setFont("helvetica","normal");doc.setFontSize(7.5);doc.text(doc.splitTextToSize(F("accidentDescription"),CW-3).slice(0,3),ML+1,y+8);y+=19;
      sectionBand("First Party Insurance");
      fieldRow([{label:"Insurance Company",value:F("fp_insurerName"),w:CW*0.5},{label:"Claim No.",value:F("fp_claimNo"),w:CW*0.25},{label:"Policy No.",value:F("fp_policyNo"),w:CW*0.25}]);
      fieldRow([{label:"Adjuster",value:F("fp_adjuster"),w:CW*0.5},{label:"Phone",value:F("fp_phone"),w:CW*0.25},{label:"Fax",value:F("fp_fax"),w:CW*0.25}]);
      fieldRow([{label:"Auto Make",value:F("fp_autoMake"),w:CW/3},{label:"Model",value:F("fp_autoModel"),w:CW/3},{label:"Year / Plate",value:F("fp_autoYear")+" / "+F("fp_plateNo"),w:CW/3}]);
      sectionBand("Third Party Insurance");
      fieldRow([{label:"Driver Name",value:F("tp_driverName"),w:CW/2},{label:"Driver Licence",value:F("tp_driverLicenseNo"),w:CW/2}]);
      fieldRow([{label:"Insurance Company",value:F("tp_insurerName"),w:CW*0.5},{label:"Claim No.",value:F("tp_claimNo"),w:CW*0.25},{label:"Policy No.",value:F("tp_policyNo"),w:CW*0.25}]);
      sectionBand("Medical & Treatment");
      fieldRow([{label:"Went to Hospital?",value:F("wentToHospital"),w:CW/3},{label:"Ambulance Required?",value:F("ambulanceRequired"),w:CW/3},{label:"Hospital Name",value:F("hospitalName"),w:CW/3}]);
      fieldRow([{label:"Family Physician",value:F("familyDoctor"),w:CW/2},{label:"Phone",value:F("familyDoctorPhone"),w:CW/4},{label:"Fax",value:F("familyDoctorFax"),w:CW/4}]);
      [1,2,3,4].forEach(n=>{if(F(`tp${n}_centre`)){fieldRow([{label:`Treatment Provider ${n}`,value:F(`tp${n}_centre`),w:CW*0.5},{label:"Type",value:["Physio","Chiro","Rehab","Psych","Massage"].filter(t=>C(`tp${n}_type_${t}`)).join(", "),w:CW*0.3},{label:"Phone",value:F(`tp${n}_phone`),w:CW*0.2}]);}});
      const physSel=PHYSICAL_AREAS.filter(a=>C(`postPhysical_${a}`));
      const neuroSel=NEURO_PSYCH.filter(a=>C(`postNeuro_${a}`));
      if(physSel.length||neuroSel.length){
        sectionBand("Post-Accident Conditions");
        if(physSel.length){checkY(10);txt("Physical: ",ML,y,{size:7,bold:true});doc.setFont("helvetica","normal");doc.setFontSize(7);doc.text(doc.splitTextToSize(physSel.join(", "),CW-25),ML+20,y);y+=Math.ceil(physSel.length/6)*4+2;}
        if(neuroSel.length){checkY(10);txt("Neuro/Psych: ",ML,y,{size:7,bold:true});doc.setFont("helvetica","normal");doc.setFontSize(7);doc.text(doc.splitTextToSize(neuroSel.join(", "),CW-30),ML+28,y);y+=Math.ceil(neuroSel.length/6)*4+2;}
      }
      sectionBand("Financial & Income");
      const empStatus=["empFullTime","empSelfEmployed","empUnemployed","empRetired","empStudent","empCaregiver","empEI"].filter(k=>C(k)).map(k=>k.replace("emp","")).join(", ");
      fieldRow([{label:"Employment Status at Time of Accident",value:empStatus,w:CW}]);
      [1,2].forEach(n=>{if(F(`emp${n}_name`)){fieldRow([{label:`Employer ${n}`,value:F(`emp${n}_name`),w:CW/2},{label:"Occupation",value:F(`emp${n}_occupation`),w:CW/4},{label:"Salary",value:F(`emp${n}_salary`),w:CW/4}]);}});
    }

    // Universal signature for all generic forms
    sectionBand("Signature");
    sigRow(["Name (please print)","Signature","Date (yyyy/mm/dd)"],[F("sigName")||F("appSigName"),F("signature")||F("appSig"),F("dateSigned")||F("appSigDate")]);

    addFooters(ref);
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
      await exportToPDF(allFields, templateId, templateName);
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