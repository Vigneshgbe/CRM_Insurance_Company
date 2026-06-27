import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/constants";

function getToken() {
  return localStorage.getItem("crm_token") || localStorage.getItem("token") || "";
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function YesNo({ name, value, onChange }: { name: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-4 h-9">
      <label className="flex items-center gap-1.5 text-sm cursor-pointer">
        <Checkbox checked={value === "yes"} onCheckedChange={(c) => onChange(c ? "yes" : "")} aria-label={`${name} yes`} />
        Yes
      </label>
      <label className="flex items-center gap-1.5 text-sm cursor-pointer">
        <Checkbox checked={value === "no"} onCheckedChange={(c) => onChange(c ? "no" : "")} aria-label={`${name} no`} />
        No
      </label>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b pb-2 mb-3 mt-5 first:mt-0">
      {title}
    </h3>
  );
}

const defaultState = {
  workAccident:           "",
  commuteAccident:        "",
  wsibClaim:              "",
  streetName:             "",
  majorIntersection:      "",
  city:                   "",
  provinceState:          "",
  accidentDate:           "",
  accidentTime:           "",
  reportedPolice:         "",
  dateReported:           "",
  policeDepartment:       "",
  collisionCentre:        false,
  policeAttended:         false,
  incidentNo:             "",
  officer:                "",
  badgeNo:                "",
  youCharged:             "",
  youChargedDesc:         "",
  thirdPartyCharged:      "",
  thirdPartyChargedDesc:  "",
  anyWitness:             "",
  witnessName:            "",
  witnessPhone:           "",
  numOccupants:           "",
  seatingArrangement:     "",
  vehiclesInvolved:       "",
  photosDamage:           "",
  estimatedDamage:        "",
  ambulanceAttended:      false,
  wentToHospital:         false,
  wentToDoctor:           false,
  accidentDescription:    "",
  involvement:            "",
};

export default function AccidentDetailsSection({ caseId }: { caseId?: string }) {
  const { toast } = useToast();
  const [fetching, setFetching] = useState(!!caseId);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState({ ...defaultState });

  const upd = (k: keyof typeof defaultState, v: any) =>
    setForm(p => ({ ...p, [k]: v }));

  // ── Load from DB ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!caseId) { setFetching(false); return; }
    fetch(`${API_BASE_URL}/cases/${caseId}/accident-details`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.ok ? r.json() : {})
      .then(data => {
        if (data && Object.keys(data).length > 0) {
          setForm(prev => ({ ...prev, ...data }));
        }
      })
      .catch(() => toast({ title: "Failed to load accident details", variant: "destructive" }))
      .finally(() => setFetching(false));
  }, [caseId]);

  // ── Save to DB ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!caseId) {
      toast({ title: "No case ID — cannot save", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/cases/${caseId}/accident-details`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Accident Details Saved" });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (fetching) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;

  return (
    <div className="border rounded-md p-6 mt-3 bg-background">
      <SectionHeader title="Work-Related" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Did the accident happen while you were working?">
          <YesNo name="work-accident" value={form.workAccident} onChange={v => upd("workAccident", v)} />
        </Field>
        <Field label="Did the accident happen while travelling to and/or from work?">
          <YesNo name="commute-accident" value={form.commuteAccident} onChange={v => upd("commuteAccident", v)} />
        </Field>
        <Field label="If yes, did client file claim with W.S.I.B?">
          <YesNo name="wsib-claim" value={form.wsibClaim} onChange={v => upd("wsibClaim", v)} />
        </Field>
      </div>

      <SectionHeader title="Location of the Accident" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Street Name">
          <Input className="h-9" value={form.streetName} onChange={e => upd("streetName", e.target.value)} />
        </Field>
        <Field label="Major Intersection">
          <Input className="h-9" value={form.majorIntersection} onChange={e => upd("majorIntersection", e.target.value)} />
        </Field>
        <Field label="City">
          <Input className="h-9" value={form.city} onChange={e => upd("city", e.target.value)} />
        </Field>
        <Field label="Province/State">
          <Input className="h-9" value={form.provinceState} onChange={e => upd("provinceState", e.target.value)} />
        </Field>
        <Field label="Date">
          <Input type="date" className="h-9" value={form.accidentDate} onChange={e => upd("accidentDate", e.target.value)} />
        </Field>
        <Field label="Time">
          <Input type="time" className="h-9" value={form.accidentTime} onChange={e => upd("accidentTime", e.target.value)} />
        </Field>
      </div>

      <SectionHeader title="Police Report" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Accident Reported to the Police?">
          <YesNo name="reported-police" value={form.reportedPolice} onChange={v => upd("reportedPolice", v)} />
        </Field>
        <Field label="Date of Reported">
          <Input type="date" className="h-9" value={form.dateReported} onChange={e => upd("dateReported", e.target.value)} />
        </Field>
        <Field label="Police Department / Collision Reporting Centre">
          <Input className="h-9" value={form.policeDepartment} onChange={e => upd("policeDepartment", e.target.value)} />
        </Field>
      </div>
      <div className="flex flex-wrap gap-6 mt-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox checked={form.collisionCentre} onCheckedChange={c => upd("collisionCentre", !!c)} />
          Went to collision reporting centre
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox checked={form.policeAttended} onCheckedChange={c => upd("policeAttended", !!c)} />
          Police attended
        </label>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <Field label="Incident No">
          <Input className="h-9" value={form.incidentNo} onChange={e => upd("incidentNo", e.target.value)} />
        </Field>
        <Field label="Officer">
          <Input className="h-9" value={form.officer} onChange={e => upd("officer", e.target.value)} />
        </Field>
        <Field label="Badge No">
          <Input className="h-9" value={form.badgeNo} onChange={e => upd("badgeNo", e.target.value)} />
        </Field>
      </div>

      <SectionHeader title="Charges" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Were you charged?">
          <YesNo name="you-charged" value={form.youCharged} onChange={v => upd("youCharged", v)} />
        </Field>
        <Field label="If yes, list charge">
          <Input className="h-9" value={form.youChargedDesc} onChange={e => upd("youChargedDesc", e.target.value)} />
        </Field>
        <Field label="Was Third Party charged?">
          <YesNo name="third-party-charged" value={form.thirdPartyCharged} onChange={v => upd("thirdPartyCharged", v)} />
        </Field>
        <Field label="If yes, list charge">
          <Input className="h-9" value={form.thirdPartyChargedDesc} onChange={e => upd("thirdPartyChargedDesc", e.target.value)} />
        </Field>
      </div>

      <SectionHeader title="Witnesses" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Any witness?">
          <YesNo name="any-witness" value={form.anyWitness} onChange={v => upd("anyWitness", v)} />
        </Field>
        <Field label="If Yes Name">
          <Input className="h-9" value={form.witnessName} onChange={e => upd("witnessName", e.target.value)} />
        </Field>
        <Field label="Phone No.">
          <Input className="h-9" placeholder="+1-XXX-XXX-XXXX" value={form.witnessPhone} onChange={e => upd("witnessPhone", e.target.value)} />
        </Field>
      </div>

      <SectionHeader title="Vehicle & Damage" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Number of Occupants in Vehicle">
          <Input type="number" className="h-9" value={form.numOccupants} onChange={e => upd("numOccupants", e.target.value)} />
        </Field>
        <Field label="Seating Arrangement">
          <Input className="h-9" value={form.seatingArrangement} onChange={e => upd("seatingArrangement", e.target.value)} />
        </Field>
        <Field label="How many vehicles involved">
          <Input type="number" className="h-9" value={form.vehiclesInvolved} onChange={e => upd("vehiclesInvolved", e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Field label="Are there photos of the damages?">
          <YesNo name="photos-damage" value={form.photosDamage} onChange={v => upd("photosDamage", v)} />
        </Field>
        <Field label="Estimated Property Damage">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
            <Input type="number" className="h-9 pl-6" value={form.estimatedDamage} onChange={e => upd("estimatedDamage", e.target.value)} />
          </div>
        </Field>
      </div>

      <SectionHeader title="Medical Response" />
      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox checked={form.ambulanceAttended} onCheckedChange={c => upd("ambulanceAttended", !!c)} />
          Ambulance attended
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox checked={form.wentToHospital} onCheckedChange={c => upd("wentToHospital", !!c)} />
          Went to the hospital
        </label>
        <label className="flex items-start gap-2 text-sm cursor-pointer">
          <Checkbox className="mt-0.5" checked={form.wentToDoctor} onCheckedChange={c => upd("wentToDoctor", !!c)} />
          <span>Went to doctor / nurse practitioner / other Regulated Healthcare Provider (e.g., Physiotherapist, Chiropractor etc.)</span>
        </label>
      </div>

      <SectionHeader title="Accident Description" />
      <Field label="Give a brief description of the accident. Describe all injuries sustained as a result of the accident.">
        <Textarea
          rows={6}
          className="text-sm"
          value={form.accidentDescription}
          onChange={e => upd("accidentDescription", e.target.value)}
        />
      </Field>

      <SectionHeader title="How were you involved in the accident?" />
      <RadioGroup value={form.involvement} onValueChange={v => upd("involvement", v)} className="gap-3">
        <div className="flex items-center gap-2">
          <RadioGroupItem value="driver-insured" id="driver-insured" />
          <Label htmlFor="driver-insured" className="text-sm cursor-pointer">Driver of Vehicle Insured under this Policy</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="passenger-insured" id="passenger-insured" />
          <Label htmlFor="passenger-insured" className="text-sm cursor-pointer">Passenger of Vehicle Insured under this Policy</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="pedestrian-cyclist" id="pedestrian-cyclist" />
          <Label htmlFor="pedestrian-cyclist" className="text-sm cursor-pointer">Pedestrian or Cyclist</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="driver-passenger-uninsured" id="driver-passenger-uninsured" />
          <Label htmlFor="driver-passenger-uninsured" className="text-sm cursor-pointer">Driver or Passenger of a vehicle not insured under this Policy</Label>
        </div>
      </RadioGroup>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}