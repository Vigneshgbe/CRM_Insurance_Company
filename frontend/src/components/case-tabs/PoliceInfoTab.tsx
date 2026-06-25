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
  <div>
    <Label className="text-xs">{label}</Label>
    <Input value={value || ""} onChange={e => onChange(e.target.value)} className="mt-1 h-9 text-sm" />
  </div>
);

export default function PoliceInfoTab({ caseId }: { caseId: string }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [d, setD] = useState<any>({});
  const s = (k: string) => (v: string) => setD((p: any) => ({ ...p, [k]: v }));

  useEffect(() => {
    fetch(`${API}/cases/${caseId}/police-info`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.ok ? r.json() : null).then(r => { if (r) setD(r); });
  }, [caseId]);

  async function save() {
    setSaving(true);
    try {
      const r = await fetch(`${API}/cases/${caseId}/police-info`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` }, body: JSON.stringify(d) });
      if (!r.ok) throw new Error();
      toast({ title: "Saved" });
    } catch { toast({ title: "Save failed", variant: "destructive" }); }
    finally { setSaving(false); }
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Police Report Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <F label="Police Department / Centre" value={d.policeCentre} onChange={s("policeCentre")} />
          <F label="Officer Name" value={d.officerName} onChange={s("officerName")} />
          <F label="Badge Number" value={d.badgeNumber} onChange={s("badgeNumber")} />
          <F label="Incident / Report No." value={d.incidentNo} onChange={s("incidentNo")} />
          <F label="Report Date" value={d.reportDate} onChange={s("reportDate")} />
          <F label="Division" value={d.division} onChange={s("division")} />
          <F label="Station Address" value={d.stationAddress} onChange={s("stationAddress")} />
          <F label="City" value={d.city} onChange={s("city")} />
          <F label="Phone" value={d.phone} onChange={s("phone")} />
          <F label="Date Report Requested" value={d.requestDate} onChange={s("requestDate")} />
          <F label="Date Report Received" value={d.receivedDate} onChange={s("receivedDate")} />
          <F label="Report Ordered" value={d.reportOrdered} onChange={s("reportOrdered")} />
          <div className="col-span-2">
            <Label className="text-xs">Notes</Label>
            <Textarea value={d.notes || ""} onChange={e => s("notes")(e.target.value)} className="mt-1 text-sm" rows={3} />
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end"><Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button></div>
    </div>
  );
}
