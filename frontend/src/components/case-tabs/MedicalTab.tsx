import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { PHYSICAL_CONDITIONS, NEUROLOGICAL_CONDITIONS, PSYCHOLOGICAL_CONDITIONS } from "@/lib/constants";

export default function MedicalTab({ caseId }: { caseId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [physicalChecked, setPhysicalChecked] = useState<string[]>(["Neck", "Lower Back", "Shoulders"]);
  const [neuroChecked, setNeuroChecked] = useState<string[]>(["Headaches", "Dizziness"]);
  const [psychChecked, setPsychChecked] = useState<string[]>(["Anxiety", "Lack of sleep", "Fear of driving"]);
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      doctorName: "Dr. Williams", doctorAddress: "500 University Ave", doctorCity: "Toronto", doctorProvPC: "Ontario M5G 1V7",
      doctorPhone: "4165559000", doctorFax: "4165559001", doctorOutstanding: "500",
      wentToHospital: "Yes", ambulanceRequired: "Yes",
      hospitalName: "Sunnybrook Health Sciences", hospitalAddress: "2075 Bayview Ave", hospitalCity: "Toronto",
      hospitalProvince: "Ontario", hospitalPostal: "M4N 3M5",
      dateAttended: "2024-06-15", dateReleased: "2024-06-15", xrayTaken: "Yes",
      clinicName: "LifeMark Physiotherapy", clinicAddress: "100 Bloor St W", clinicCity: "Toronto", clinicProvPC: "Ontario M5S 1M1",
      clinicPhone: "4165558000", clinicFax: "4165558001", clinicOutstanding: "1200",
      tp1Centre: "PhysioCare Plus", tp1Address: "200 Dundas St", tp1Phone: "4165557000", tp1Fax: "4165557001", tp1Type: "Physio",
      tp2Centre: "Back in Motion Chiro", tp2Address: "88 Queen St", tp2Phone: "4165556000", tp2Fax: "4165556001", tp2Type: "Chiro",
      tp3Centre: "", tp3Address: "", tp3Phone: "", tp3Fax: "", tp3Type: "",
      tp4Centre: "", tp4Address: "", tp4Phone: "", tp4Fax: "", tp4Type: "",
      preCondition: "Lower back pain", preTimeFrame: "2020-2022", preOperative: "None", preStatus: "Resolved", postStatus: "Aggravated",
      med1: "Naproxen 500mg", med2: "Cyclobenzaprine 10mg", med3: "Gabapentin 300mg", med4: "",
    },
  });

  const toggleCheck = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const onSubmit = () => {
    setLoading(true);
    setTimeout(() => { toast({ title: "Medical Info Saved" }); setLoading(false); }, 500);
  };

  const F = ({ label, name, type = "text" }: { label: string; name: string; type?: string }) => (
    <div><Label className="text-xs">{label}</Label><Input {...register(name as any)} type={type} className="h-8 text-xs mt-1" /></div>
  );

  const YN = ({ label, name, highlight = false }: { label: string; name: string; highlight?: boolean }) => (
    <div>
      <Label className="text-xs">{label}</Label>
      <Select value={watch(name as any)} onValueChange={(v) => setValue(name as any, v)}>
        <SelectTrigger className={`h-8 text-xs mt-1 ${highlight && watch(name as any) === "Yes" ? "border-warning bg-warning/10" : ""}`}><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
      </Select>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Family Doctor</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <F label="Doctor Name" name="doctorName" />
                <F label="Address" name="doctorAddress" />
                <F label="City" name="doctorCity" />
                <F label="Province/PC" name="doctorProvPC" />
                <F label="Phone" name="doctorPhone" />
                <F label="Fax" name="doctorFax" />
                <F label="Outstanding ($)" name="doctorOutstanding" />
                <YN label="Went to Hospital?" name="wentToHospital" highlight />
                <YN label="Ambulance Required?" name="ambulanceRequired" highlight />
                <F label="Hospital Name" name="hospitalName" />
                <F label="Hospital Address" name="hospitalAddress" />
                <F label="City" name="hospitalCity" />
                <F label="Province" name="hospitalProvince" />
                <F label="Post Code" name="hospitalPostal" />
                <F label="Date Attended" name="dateAttended" type="date" />
                <F label="Date Released" name="dateReleased" type="date" />
                <YN label="X-Ray Taken?" name="xrayTaken" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Treating Clinic</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <F label="Clinic Name" name="clinicName" />
                <F label="Address" name="clinicAddress" />
                <F label="City" name="clinicCity" />
                <F label="Province/PC" name="clinicProvPC" />
                <F label="Phone" name="clinicPhone" />
                <F label="Fax" name="clinicFax" />
                <F label="Outstanding ($)" name="clinicOutstanding" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Treatment Providers</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="border rounded p-3 space-y-2">
                  <Label className="text-xs font-medium">Provider {i}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input {...register(`tp${i}Centre` as any)} placeholder="Centre" className="h-7 text-xs" />
                    <Input {...register(`tp${i}Address` as any)} placeholder="Address" className="h-7 text-xs" />
                    <Input {...register(`tp${i}Phone` as any)} placeholder="Phone" className="h-7 text-xs" />
                    <Input {...register(`tp${i}Fax` as any)} placeholder="Fax" className="h-7 text-xs" />
                  </div>
                  <div className="flex gap-3">
                    {["Physio", "Chiro", "Rehab", "Psych"].map((t) => (
                      <label key={t} className="flex items-center gap-1 text-xs">
                        <input type="checkbox" defaultChecked={watch(`tp${i}Type` as any) === t} className="h-3 w-3" />
                        {t}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Post-Accident Medical Conditions</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium">Physical</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {PHYSICAL_CONDITIONS.map((c) => (
                    <label key={c} className="flex items-center gap-1 text-xs">
                      <Checkbox checked={physicalChecked.includes(c)} onCheckedChange={() => toggleCheck(physicalChecked, setPhysicalChecked, c)} className="h-3.5 w-3.5" />
                      {c}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium">Neurological</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {NEUROLOGICAL_CONDITIONS.map((c) => (
                    <label key={c} className="flex items-center gap-1 text-xs">
                      <Checkbox checked={neuroChecked.includes(c)} onCheckedChange={() => toggleCheck(neuroChecked, setNeuroChecked, c)} className="h-3.5 w-3.5" />
                      {c}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium">Psychological</Label>
                <div className="flex flex-wrap gap-3 mt-1">
                  {PSYCHOLOGICAL_CONDITIONS.map((c) => (
                    <label key={c} className="flex items-center gap-1 text-xs">
                      <Checkbox checked={psychChecked.includes(c)} onCheckedChange={() => toggleCheck(psychChecked, setPsychChecked, c)} className="h-3.5 w-3.5" />
                      {c}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Pre-Accident Conditions & Medications</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-4">
              <F label="Condition" name="preCondition" />
              <F label="Time Frame" name="preTimeFrame" />
              <F label="Operative Procedure" name="preOperative" />
              <F label="Pre-Accident Status" name="preStatus" />
              <F label="Post-Accident Status" name="postStatus" />
            </div>
            <Label className="text-xs font-medium">Medications</Label>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-1">
              {[1, 2, 3, 4].map((i) => (
                <Input key={i} {...register(`med${i}` as any)} placeholder={`Medication ${i}`} className="h-8 text-xs" />
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Medical Info"}</Button>
        </div>
      </div>
    </form>
  );
}
