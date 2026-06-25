import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const API = "http://localhost:5000/api";
const token = () => localStorage.getItem("crm_token") || "";
const F = ({ label, value, onChange }: any) => (
  <div><Label className="text-xs">{label}</Label><Input value={value || ""} onChange={e => onChange(e.target.value)} className="mt-1 h-9 text-sm" /></div>
);
const YN = ({ label, value, onChange }: any) => (
  <div><Label className="text-xs">{label}</Label>
    <Select value={value || ""} onValueChange={onChange}>
      <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
      <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
    </Select>
  </div>
);

export default function InitialInterviewTab({ caseId }: { caseId: string }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [d, setD] = useState<any>({});
  const s = (k: string) => (v: string) => setD((p: any) => ({ ...p, [k]: v }));

  useEffect(() => {
    fetch(`${API}/cases/${caseId}/initial-interview`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.ok ? r.json() : null).then(r => { if (r) setD(r); });
  }, [caseId]);

  async function save() {
    setSaving(true);
    try {
      const r = await fetch(`${API}/cases/${caseId}/initial-interview`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` }, body: JSON.stringify(d) });
      if (!r.ok) throw new Error();
      toast({ title: "Saved" });
    } catch { toast({ title: "Save failed", variant: "destructive" }); }
    finally { setSaving(false); }
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Interview Details</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <F label="Interviewed By" value={d.interviewedBy} onChange={s("interviewedBy")} />
          <F label="Interviewed On" value={d.interviewedOn} onChange={s("interviewedOn")} />
          <F label="Referred By" value={d.referredBy} onChange={s("referredBy")} />
          <YN label="Conflict Checked" value={d.conflictChecked} onChange={s("conflictChecked")} />
          <YN label="Any Conflict Found" value={d.anyConflict} onChange={s("anyConflict")} />
          <YN label="Speaks English" value={d.speaksEnglish} onChange={s("speaksEnglish")} />
          <YN label="Interpreter Required" value={d.interpreterRequired} onChange={s("interpreterRequired")} />
          {d.interpreterRequired === "Yes" && <F label="Language" value={d.language} onChange={s("language")} />}
          <YN label="Born in Canada" value={d.bornInCanada} onChange={s("bornInCanada")} />
          {d.bornInCanada === "No" && <F label="Country of Origin" value={d.whereBorn} onChange={s("whereBorn")} />}
          {d.bornInCanada === "No" && <F label="Year Immigrated" value={d.yearImmigrated} onChange={s("yearImmigrated")} />}
          <YN label="Was Seat-Belted" value={d.seatBelted} onChange={s("seatBelted")} />
          <YN label="Accident At Work" value={d.accidentAtWork} onChange={s("accidentAtWork")} />
          {d.accidentAtWork === "Yes" && <YN label="WSIB Filed" value={d.wsibFiled} onChange={s("wsibFiled")} />}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Accident Description</CardTitle></CardHeader>
        <CardContent>
          <Textarea value={d.accidentDescription || ""} onChange={e => s("accidentDescription")(e.target.value)} className="text-sm" rows={5} placeholder="Describe the accident..." />
        </CardContent>
      </Card>
      <div className="flex justify-end"><Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button></div>
    </div>
  );
}
