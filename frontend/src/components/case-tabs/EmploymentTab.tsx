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

function EmployerSection({ title, prefix, d, s }: any) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <F label="Employer Name" value={d[`${prefix}Name`]} onChange={s(`${prefix}Name`)} />
        <F label="Address" value={d[`${prefix}Address`]} onChange={s(`${prefix}Address`)} />
        <F label="City" value={d[`${prefix}City`]} onChange={s(`${prefix}City`)} />
        <F label="Postal Code" value={d[`${prefix}Postal`]} onChange={s(`${prefix}Postal`)} />
        <F label="Phone" value={d[`${prefix}Phone`]} onChange={s(`${prefix}Phone`)} />
        <F label="Fax" value={d[`${prefix}Fax`]} onChange={s(`${prefix}Fax`)} />
        <F label="Job Title" value={d[`${prefix}JobTitle`]} onChange={s(`${prefix}JobTitle`)} />
        <F label="Salary / Wages" value={d[`${prefix}Salary`]} onChange={s(`${prefix}Salary`)} />
        <F label="Hours / Week" value={d[`${prefix}Hours`]} onChange={s(`${prefix}Hours`)} />
        <F label="Last Day Worked" value={d[`${prefix}LastDay`]} onChange={s(`${prefix}LastDay`)} />
        <F label="Length of Employment" value={d[`${prefix}Length`]} onChange={s(`${prefix}Length`)} />
        <F label="IRB Entitled Amount" value={d[`${prefix}Irb`]} onChange={s(`${prefix}Irb`)} />
      </CardContent>
    </Card>
  );
}

export default function EmploymentTab({ caseId }: { caseId: string }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [d, setD] = useState<any>({});
  const s = (k: string) => (v: string) => setD((p: any) => ({ ...p, [k]: v }));

  useEffect(() => {
    fetch(`${API}/cases/${caseId}/employment`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.ok ? r.json() : null).then(r => { if (r) setD(r); });
  }, [caseId]);

  async function save() {
    setSaving(true);
    try {
      const r = await fetch(`${API}/cases/${caseId}/employment`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` }, body: JSON.stringify(d) });
      if (!r.ok) throw new Error();
      toast({ title: "Saved" });
    } catch { toast({ title: "Save failed", variant: "destructive" }); }
    finally { setSaving(false); }
  }

  return (
    <div className="p-4 space-y-4">
      <EmployerSection title="Full-Time Employer" prefix="ft" d={d} s={s} />
      <EmployerSection title="Part-Time Employer" prefix="pt" d={d} s={s} />
      <div className="flex justify-end"><Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button></div>
    </div>
  );
}
