import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { PHYSICAL_CONDITIONS, NEUROLOGICAL_CONDITIONS, PSYCHOLOGICAL_CONDITIONS, API_BASE_URL } from "@/lib/constants";

export default function MedicalTab({ caseId }: { caseId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [physicalChecked, setPhysicalChecked] = useState<string[]>([]);
  const [neuroChecked, setNeuroChecked] = useState<string[]>([]);
  const [psychChecked, setPsychChecked] = useState<string[]>([]);

  const { register, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: {
      doctorName: "", doctorAddress: "", doctorCity: "", doctorProvPC: "",
      doctorPhone: "", doctorFax: "", doctorOutstanding: "",
      wentToHospital: "No", ambulanceRequired: "No",
      hospitalName: "", hospitalAddress: "", hospitalCity: "",
      hospitalProvince: "", hospitalPostal: "",
      dateAttended: "", dateReleased: "", xrayTaken: "No",
      clinicName: "", clinicAddress: "", clinicCity: "", clinicProvPC: "",
      clinicPhone: "", clinicFax: "", clinicOutstanding: "",
      tp1Centre: "", tp1Address: "", tp1Phone: "", tp1Fax: "", tp1Type: "",
      tp2Centre: "", tp2Address: "", tp2Phone: "", tp2Fax: "", tp2Type: "",
      tp3Centre: "", tp3Address: "", tp3Phone: "", tp3Fax: "", tp3Type: "",
      tp4Centre: "", tp4Address: "", tp4Phone: "", tp4Fax: "", tp4Type: "",
      preCondition: "", preTimeFrame: "", preOperative: "", preStatus: "", postStatus: "",
      med1: "", med2: "", med3: "", med4: "",
    },
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API_BASE_URL}/cases/${caseId}/medical`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        // Split out checkbox arrays before reset
        const { physicalChecked: pc, neuroChecked: nc, psychChecked: sc, ...rest } = data;
        reset(rest);
        if (Array.isArray(pc)) setPhysicalChecked(pc);
        if (Array.isArray(nc)) setNeuroChecked(nc);
        if (Array.isArray(sc)) setPsychChecked(sc);
      })
      .catch(() => toast({ title: "Failed to load medical data", variant: "destructive" }))
      .finally(() => setFetching(false));
  }, [caseId]);

  const toggleCheck = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/cases/${caseId}/medical`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...data, physicalChecked, neuroChecked, psychChecked }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Medical Info Saved" });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
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

  if (fetching) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;

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
                        <input type="checkbox" checked={watch(`tp${i}Type` as any) === t} onChange={(e) => setValue(`tp${i}Type` as any, e.target.checked ? t : "")} className="h-3 w-3" />
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
