import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const API = "http://localhost:5000/api";
const token = () => localStorage.getItem("crm_token") || "";
const F = ({ label, value, onChange }: any) => (
  <div><Label className="text-xs">{label}</Label><Input value={value || ""} onChange={e => onChange(e.target.value)} className="mt-1 h-9 text-sm" /></div>
);

export default function SpecialistTab({ caseId }: { caseId: string }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [d, setD] = useState<any>({});
  const s = (k: string) => (v: string) => setD((p: any) => ({ ...p, [k]: v }));

  useEffect(() => {
    fetch(`${API}/cases/${caseId}/specialist`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.ok ? r.json() : null).then(r => { if (r) setD(r); });
  }, [caseId]);

  async function save() {
    setSaving(true);
    try {
      const r = await fetch(`${API}/cases/${caseId}/specialist`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` }, body: JSON.stringify(d) });
      if (!r.ok) throw new Error();
      toast({ title: "Saved" });
    } catch { toast({ title: "Save failed", variant: "destructive" }); }
    finally { setSaving(false); }
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Specialist / Assessment Centre</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <F label="Company / Centre Name" value={d.company} onChange={s("company")} />
          <F label="Specialist Name" value={d.specialistName} onChange={s("specialistName")} />
          <F label="Address" value={d.address} onChange={s("address")} />
          <F label="City" value={d.city} onChange={s("city")} />
          <F label="Phone" value={d.phone} onChange={s("phone")} />
          <F label="Fax" value={d.fax} onChange={s("fax")} />
          <F label="Specialty Type" value={d.specialtyType} onChange={s("specialtyType")} />
          <F label="Assessment Date" value={d.assessmentDate} onChange={s("assessmentDate")} />
          <F label="Report Date" value={d.reportDate} onChange={s("reportDate")} />
          <div className="col-span-2">
            <Label className="text-xs">Findings</Label>
            <Textarea value={d.findings || ""} onChange={e => s("findings")(e.target.value)} className="mt-1 text-sm" rows={3} />
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end"><Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button></div>
    </div>
  );
}
