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

export default function NoFaultTab({ caseId }: { caseId: string }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [d, setD] = useState<any>({});
  const s = (k: string) => (v: string) => setD((p: any) => ({ ...p, [k]: v }));

  useEffect(() => {
    fetch(`${API}/cases/${caseId}/no-fault`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.ok ? r.json() : null).then(r => { if (r) setD(r); });
  }, [caseId]);

  async function save() {
    setSaving(true);
    try {
      const r = await fetch(`${API}/cases/${caseId}/no-fault`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` }, body: JSON.stringify(d) });
      if (!r.ok) throw new Error();
      toast({ title: "Saved" });
    } catch { toast({ title: "Save failed", variant: "destructive" }); }
    finally { setSaving(false); }
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">AB / MVA Insurance Company</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <F label="Company Name" value={d.abCompany} onChange={s("abCompany")} />
          <F label="Adjuster Name" value={d.abAdjuster} onChange={s("abAdjuster")} />
          <F label="Adjuster Email" value={d.abAdjusterEmail} onChange={s("abAdjusterEmail")} />
          <F label="Adjuster Phone" value={d.abAdjusterPhone} onChange={s("abAdjusterPhone")} />
          <F label="Adjuster Fax" value={d.abAdjusterFax} onChange={s("abAdjusterFax")} />
          <F label="Adjuster Ext" value={d.abAdjusterExt} onChange={s("abAdjusterExt")} />
          <F label="Claim No." value={d.abClaimNo} onChange={s("abClaimNo")} />
          <F label="Policy No." value={d.abPolicyNo} onChange={s("abPolicyNo")} />
          <F label="Date Reported" value={d.dateReported} onChange={s("dateReported")} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Independent Company</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <F label="Company Name" value={d.indCompany} onChange={s("indCompany")} />
          <F label="Adjuster" value={d.indAdjuster} onChange={s("indAdjuster")} />
          <F label="Address" value={d.indAddress} onChange={s("indAddress")} />
          <F label="City" value={d.indCity} onChange={s("indCity")} />
          <F label="Postal" value={d.indPostal} onChange={s("indPostal")} />
          <F label="Phone" value={d.indPhone} onChange={s("indPhone")} />
          <F label="Fax" value={d.indFax} onChange={s("indFax")} />
          <F label="Claim No." value={d.indClaimNo} onChange={s("indClaimNo")} />
          <F label="Supervisor" value={d.indSupervisor} onChange={s("indSupervisor")} />
        </CardContent>
      </Card>
      <div className="flex justify-end"><Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button></div>
    </div>
  );
}
