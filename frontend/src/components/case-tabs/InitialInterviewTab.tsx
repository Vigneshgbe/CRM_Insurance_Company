import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { PROVINCES } from "@/lib/constants";

export default function InitialInterviewTab({ caseId }: { caseId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      conflictChecked: "No", anyConflict: "No", fileNo: `MVA-2024-100${caseId}`,
      dateOfMVA: "2024-06-15", interviewedBy: "Amanda Singh", interviewedOn: "2024-06-20",
      referredBy: "Dr. Williams", speaksEnglish: "Yes", interpreterRequired: "No", language: "",
      bornInCanada: "Yes", whereBorn: "", yearImmigrated: "",
      clientRole: "Driver", seatBelted: "Yes", accidentAtWork: "No", wsibFiled: "No",
      streetName: "Highway 401", majorIntersection: "Yonge Street", city: "Toronto",
      province: "Ontario", timeOfMVA: "14:30", policeReported: "Yes",
      dateReported: "2024-06-15", policeCameToScene: "Yes",
      policeDepartment: "Toronto Police Service - Traffic Services", incidentNo: "TPS-2024-45678",
      officerName: "Const. M. Roberts", badgeNo: "4521",
      clientCharged: "No", clientChargedDesc: "", thirdPartyCharged: "Yes",
      thirdPartyChargedDesc: "Careless driving under HTA s.130",
      numOccupants: "1", seatingArrangement: "Driver only",
      photosOfDamage: "Yes", estimatedDamage: "12000",
      accidentDescription: "Client was travelling westbound on Highway 401 in the centre lane when the at-fault vehicle changed lanes suddenly from the right lane, striking the client's vehicle on the passenger side. The impact caused the client's vehicle to spin and collide with the median barrier. Client reported immediate neck and back pain. Paramedics attended the scene and the client was transported to Sunnybrook Hospital.",
    },
  });

  const onSubmit = () => {
    setLoading(true);
    setTimeout(() => { toast({ title: "Initial Interview Saved" }); setLoading(false); }, 500);
  };

  const YN = ({ label, name }: { label: string; name: string }) => (
    <div>
      <Label className="text-xs">{label}</Label>
      <Select value={watch(name as any)} onValueChange={(v) => setValue(name as any, v)}>
        <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="Yes">Yes</SelectItem>
          <SelectItem value="No">No</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const F = ({ label, name, type = "text" }: { label: string; name: string; type?: string }) => (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input {...register(name as any)} type={type} className="h-8 text-xs mt-1" />
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Conflict Check</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <YN label="Conflict Checked?" name="conflictChecked" />
              <YN label="Any Conflict Found?" name="anyConflict" />
              <F label="File No" name="fileNo" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Interview Details</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <F label="Date of MVA" name="dateOfMVA" type="date" />
              <F label="Interviewed By" name="interviewedBy" />
              <F label="Interviewed On" name="interviewedOn" type="date" />
              <F label="Referred By" name="referredBy" />
              <YN label="Speaks English?" name="speaksEnglish" />
              <YN label="Interpreter Required?" name="interpreterRequired" />
              {watch("interpreterRequired" as any) === "Yes" && <F label="Language" name="language" />}
              <YN label="Born in Canada?" name="bornInCanada" />
              {watch("bornInCanada" as any) === "No" && <>
                <F label="Where Born" name="whereBorn" />
                <F label="Year Immigrated" name="yearImmigrated" />
              </>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Client Role & Vehicle</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-3">
              <Label className="text-xs">Client Role in Accident</Label>
              <RadioGroup value={watch("clientRole" as any)} onValueChange={(v) => setValue("clientRole" as any, v)} className="flex flex-wrap gap-4 mt-2">
                {["Driver", "Passenger (Front Seat)", "Passenger (Back Seat)", "Pedestrian", "Other"].map((r) => (
                  <div key={r} className="flex items-center gap-1.5">
                    <RadioGroupItem value={r} id={r} />
                    <Label htmlFor={r} className="text-xs">{r}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <YN label="Seat Belted?" name="seatBelted" />
              <YN label="Accident at Work?" name="accidentAtWork" />
              {watch("accidentAtWork" as any) === "Yes" && <YN label="WSIB Claim Filed?" name="wsibFiled" />}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Accident Location</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <F label="Street Name" name="streetName" />
              <F label="Major Intersection" name="majorIntersection" />
              <F label="City" name="city" />
              <div>
                <Label className="text-xs">Province</Label>
                <Select value={watch("province" as any)} onValueChange={(v) => setValue("province" as any, v)}>
                  <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{PROVINCES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <F label="Time of MVA" name="timeOfMVA" type="time" />
              <YN label="Police Reported?" name="policeReported" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Police Information</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <F label="Date Reported" name="dateReported" type="date" />
              <YN label="Police Came to Scene?" name="policeCameToScene" />
              <F label="Police Department / CRC" name="policeDepartment" />
              <F label="Incident No" name="incidentNo" />
              <F label="Officer Name" name="officerName" />
              <F label="Badge No" name="badgeNo" />
              <YN label="Client Charged?" name="clientCharged" />
              {watch("clientCharged" as any) === "Yes" && <F label="Description" name="clientChargedDesc" />}
              <YN label="Third Party Charged?" name="thirdPartyCharged" />
              {watch("thirdPartyCharged" as any) === "Yes" && <F label="Description" name="thirdPartyChargedDesc" />}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Vehicle & Damage</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <F label="Number of Occupants" name="numOccupants" type="number" />
              <F label="Seating Arrangement" name="seatingArrangement" />
              <YN label="Photos of Damage?" name="photosOfDamage" />
              <F label="Estimated Property Damage ($)" name="estimatedDamage" />
            </div>
            <div className="mt-3">
              <Label className="text-xs">Accident Description</Label>
              <Textarea {...register("accidentDescription" as any)} rows={5} className="text-xs mt-1" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Initial Interview"}</Button>
        </div>
      </div>
    </form>
  );
}
