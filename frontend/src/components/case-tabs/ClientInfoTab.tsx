import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const API = "http://localhost:5000/api";
const token = () => localStorage.getItem("crm_token") || "";
const F = ({ label, value, onChange, type }: any) => (
  <div><Label className="text-xs">{label}</Label><Input type={type || "text"} value={value || ""} onChange={e => onChange(e.target.value)} className="mt-1 h-9 text-sm" /></div>
);

export default function ClientInfoTab({ caseId }: { caseId: string }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [d, setD] = useState<any>({});
  const s = (k: string) => (v: string) => setD((p: any) => ({ ...p, [k]: v }));

  useEffect(() => {
    fetch(`${API}/cases/${caseId}/client-info`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.ok ? r.json() : null).then(r => { if (r) setD(r); });
  }, [caseId]);

  async function save() {
    setSaving(true);
    try {
      const r = await fetch(`${API}/cases/${caseId}/client-info`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` }, body: JSON.stringify(d) });
      if (!r.ok) throw new Error();
      toast({ title: "Saved" });
    } catch { toast({ title: "Save failed", variant: "destructive" }); }
    finally { setSaving(false); }
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">ID Documents</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <F label="Driver's License No." value={d.dlNumber} onChange={s("dlNumber")} />
          <F label="OHIP / Health Card No." value={d.ohipNumber} onChange={s("ohipNumber")} />
          <F label="SIN Number" value={d.sinNumber} onChange={s("sinNumber")} type="password" />
          <F label="Ontario ID No." value={d.ontarioId} onChange={s("ontarioId")} />
          <F label="PR Card No." value={d.prCardNo} onChange={s("prCardNo")} />
          <F label="Passport No." value={d.passportNo} onChange={s("passportNo")} />
          <F label="Citizen Card No." value={d.citizenId} onChange={s("citizenId")} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Children</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          {[1,2,3,4,5,6].map(i => (
            <F key={i} label={`Child ${i} Name`} value={d[`child${i}Name`]} onChange={s(`child${i}Name`)} />
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Related Contacts</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[{key:"hk",label:"Housekeeper"},{key:"carg",label:"Caregiver"},{key:"atc",label:"Attendant Care"}].map(({key,label}) => (
            <div key={key} className="grid grid-cols-2 gap-3 border rounded p-3">
              <div className="col-span-2 text-xs font-semibold text-muted-foreground">{label}</div>
              <F label="Name" value={d[`${key}Name`]} onChange={s(`${key}Name`)} />
              <F label="Phone" value={d[`${key}Phone`]} onChange={s(`${key}Phone`)} />
              <F label="Address" value={d[`${key}Address`]} onChange={s(`${key}Address`)} />
              <F label="City" value={d[`${key}City`]} onChange={s(`${key}City`)} />
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="flex justify-end"><Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button></div>
    </div>
  );
}
