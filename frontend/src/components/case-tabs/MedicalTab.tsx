import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const API = "http://localhost:5000/api";
const token = () => localStorage.getItem("crm_token") || "";

const F = ({ label, value, onChange }: any) => (
  <div>
    <Label className="text-xs">{label}</Label>
    <Input value={value || ""} onChange={e => onChange(e.target.value)} className="mt-1 h-9 text-sm" />
  </div>
);

export default function MedicalTab({ caseId }: { caseId: string }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [d, setD] = useState<any>({});
  const s = (k: string) => (v: string) => setD((p: any) => ({ ...p, [k]: v }));

  useEffect(() => {
    fetch(`${API}/cases/${caseId}/medical`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.ok ? r.json() : null).then(r => { if (r) setD(r); });
  }, [caseId]);

  async function save() {
    setSaving(true);
    try {
      const r = await fetch(`${API}/cases/${caseId}/medical`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` }, body: JSON.stringify(d) });
      if (!r.ok) throw new Error();
      toast({ title: "Saved" });
    } catch { toast({ title: "Save failed", variant: "destructive" }); }
    finally { setSaving(false); }
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Family Doctor</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <F label="Doctor Name" value={d.doctorName} onChange={s("doctorName")} />
          <F label="Clinic Name" value={d.clinicName} onChange={s("clinicName")} />
          <F label="Address" value={d.doctorAddress} onChange={s("doctorAddress")} />
          <F label="City" value={d.doctorCity} onChange={s("doctorCity")} />
          <F label="Phone" value={d.doctorPhone} onChange={s("doctorPhone")} />
          <F label="Fax" value={d.doctorFax} onChange={s("doctorFax")} />
          <F label="First Visit" value={d.firstVisitDate} onChange={s("firstVisitDate")} />
          <F label="Last Visit" value={d.lastVisitDate} onChange={s("lastVisitDate")} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Hospital / Emergency</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <F label="Hospital Name" value={d.hospitalName} onChange={s("hospitalName")} />
          <F label="Hospital Phone" value={d.hospitalPhone} onChange={s("hospitalPhone")} />
          <F label="Hospital Address" value={d.hospitalAddress} onChange={s("hospitalAddress")} />
          <F label="Hospital City" value={d.hospitalCity} onChange={s("hospitalCity")} />
          <F label="Admission Date" value={d.admissionDate} onChange={s("admissionDate")} />
          <F label="Discharge Date" value={d.dischargeDate} onChange={s("dischargeDate")} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Physiotherapy / Chiro</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <F label="Provider Name" value={d.physioProvider} onChange={s("physioProvider")} />
          <F label="Clinic Name" value={d.physioClinic} onChange={s("physioClinic")} />
          <F label="Address" value={d.physioAddress} onChange={s("physioAddress")} />
          <F label="Phone" value={d.physioPhone} onChange={s("physioPhone")} />
          <F label="First Visit" value={d.physioFirstVisit} onChange={s("physioFirstVisit")} />
          <F label="Last Visit" value={d.physioLastVisit} onChange={s("physioLastVisit")} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Medications</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => (
            <F key={i} label={`Medication ${i}`} value={d[`med${i}`]} onChange={s(`med${i}`)} />
          ))}
        </CardContent>
      </Card>
      <div className="flex justify-end"><Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button></div>
    </div>
  );
}
