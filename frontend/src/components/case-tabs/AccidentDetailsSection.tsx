import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
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
        <Checkbox
          checked={value === "yes"}
          onCheckedChange={(c) => onChange(c ? "yes" : "")}
          aria-label={`${name} yes`}
        />
        Yes
      </label>
      <label className="flex items-center gap-1.5 text-sm cursor-pointer">
        <Checkbox
          checked={value === "no"}
          onCheckedChange={(c) => onChange(c ? "no" : "")}
          aria-label={`${name} no`}
        />
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

export default function AccidentDetailsSection() {
  const { toast } = useToast();

  const [workAccident, setWorkAccident] = useState("");
  const [commuteAccident, setCommuteAccident] = useState("");
  const [wsibClaim, setWsibClaim] = useState("");
  const [reportedPolice, setReportedPolice] = useState("");
  const [youCharged, setYouCharged] = useState("");
  const [thirdPartyCharged, setThirdPartyCharged] = useState("");
  const [anyWitness, setAnyWitness] = useState("");
  const [photosDamage, setPhotosDamage] = useState("");
  const [involvement, setInvolvement] = useState("");

  const handleSave = () => {
    toast({ title: "Accident Details Saved", description: "Your changes have been saved successfully." });
  };

  return (
    <div className="border rounded-md p-6 mt-3 bg-background">
      <SectionHeader title="Work-Related" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Did the accident happen while you were working?">
          <YesNo name="work-accident" value={workAccident} onChange={setWorkAccident} />
        </Field>
        <Field label="Did the accident happen while travelling to and/or from work?">
          <YesNo name="commute-accident" value={commuteAccident} onChange={setCommuteAccident} />
        </Field>
        <Field label="If yes, did client file claim with W.S.I.B?">
          <YesNo name="wsib-claim" value={wsibClaim} onChange={setWsibClaim} />
        </Field>
      </div>

      <SectionHeader title="Location of the Accident" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Street Name"><Input className="h-9" /></Field>
        <Field label="Major Intersection"><Input className="h-9" /></Field>
        <Field label="City"><Input className="h-9" /></Field>
        <Field label="Province/State"><Input className="h-9" /></Field>
        <Field label="Date"><Input type="date" className="h-9" /></Field>
        <Field label="Time"><Input type="time" className="h-9" /></Field>
      </div>

      <SectionHeader title="Police Report" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Accident Reported to the Police?">
          <YesNo name="reported-police" value={reportedPolice} onChange={setReportedPolice} />
        </Field>
        <Field label="Date of Reported"><Input type="date" className="h-9" /></Field>
        <Field label="Police Department / Collision Reporting Centre"><Input className="h-9" /></Field>
      </div>
      <div className="flex flex-wrap gap-6 mt-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox /> Went to collision reporting centre
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox /> Police attended
        </label>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <Field label="Incident No"><Input className="h-9" /></Field>
        <Field label="Officer"><Input className="h-9" /></Field>
        <Field label="Badge No"><Input className="h-9" /></Field>
      </div>

      <SectionHeader title="Charges" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Were you charged?">
          <YesNo name="you-charged" value={youCharged} onChange={setYouCharged} />
        </Field>
        <Field label="If yes, list charge"><Input className="h-9" /></Field>
        <Field label="Was Third Party charged?">
          <YesNo name="third-party-charged" value={thirdPartyCharged} onChange={setThirdPartyCharged} />
        </Field>
        <Field label="If yes, list charge"><Input className="h-9" /></Field>
      </div>

      <SectionHeader title="Witnesses" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Any witness?">
          <YesNo name="any-witness" value={anyWitness} onChange={setAnyWitness} />
        </Field>
        <Field label="If Yes Name"><Input className="h-9" /></Field>
        <Field label="Phone No."><Input className="h-9" placeholder="+1-XXX-XXX-XXXX" /></Field>
      </div>

      <SectionHeader title="Vehicle & Damage" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Number of Occupants in Vehicle"><Input type="number" className="h-9" /></Field>
        <Field label="Seating Arrangement"><Input className="h-9" /></Field>
        <Field label="How many vehicles involved"><Input type="number" className="h-9" /></Field>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Field label="Are there photos of the damages?">
          <YesNo name="photos-damage" value={photosDamage} onChange={setPhotosDamage} />
        </Field>
        <Field label="Estimated Property Damage">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
            <Input type="number" className="h-9 pl-6" />
          </div>
        </Field>
      </div>

      <SectionHeader title="Medical Response" />
      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox /> Ambulance attended
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox /> Went to the hospital
        </label>
        <label className="flex items-start gap-2 text-sm cursor-pointer">
          <Checkbox className="mt-0.5" />
          <span>Went to doctor / nurse practitioner / other Regulated Healthcare Provider (e.g., Physiotherapist, Chiropractor etc.)</span>
        </label>
      </div>

      <SectionHeader title="Accident Description" />
      <Field label="Give a brief description of the accident. Describe all injuries sustained as a result of the accident.">
        <Textarea rows={6} className="text-sm" />
      </Field>

      <SectionHeader title="How were you involved in the accident?" />
      <RadioGroup value={involvement} onValueChange={setInvolvement} className="gap-3">
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
        <Button onClick={handleSave}>Save</Button>
      </div>
    </div>
  );
}