import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const API = "http://localhost:5000/api";
const token = () => localStorage.getItem("crm_token") || "";

async function get(url: string) {
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token()}` } });
  if (!r.ok) return null;
  return r.json();
}
async function post(url: string, body: any) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error("Save failed");
  return r.json();
}

const F = ({ label, value, onChange, placeholder }: any) => (
  <div>
    <Label className="text-xs">{label}</Label>
    <Input value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder || ""} className="mt-1 h-9 text-sm" />
  </div>
);

export default function ThirdPartyTab({ caseId }: { caseId: string }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [d, setD] = useState<any>({});
  const s = (k: string) => (v: string) => setD((p: any) => ({ ...p, [k]: v }));

  useEffect(() => { get(`${API}/cases/${caseId}/third-party`).then(r => { if (r) setD(r); }); }, [caseId]);

  async function save() {
    setSaving(true);
    try { await post(`${API}/cases/${caseId}/third-party`, d); toast({ title: "Saved" }); }
    catch { toast({ title: "Save failed", variant: "destructive" }); }
    finally { setSaving(false); }
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Driver Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <F label="Driver Name" value={d.driverName} onChange={s("driverName")} />
          <F label="Driver DOB" value={d.driverDob} onChange={s("driverDob")} />
          <F label="Home Phone" value={d.driverHomePhone} onChange={s("driverHomePhone")} />
          <F label="Work Phone" value={d.driverWorkPhone} onChange={s("driverWorkPhone")} />
          <F label="Driver Address" value={d.driverAddress} onChange={s("driverAddress")} />
          <F label="City" value={d.driverCity} onChange={s("driverCity")} />
          <F label="Province" value={d.driverProvince} onChange={s("driverProvince")} />
          <F label="Driver License No." value={d.driverLicenseNo} onChange={s("driverLicenseNo")} />
          <F label="Employer" value={d.driverEmployer} onChange={s("driverEmployer")} />
          <F label="Work Address" value={d.driverWorkAddress} onChange={s("driverWorkAddress")} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Vehicle Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <F label="Auto Make" value={d.autoMake} onChange={s("autoMake")} />
          <F label="Auto Model" value={d.autoModel} onChange={s("autoModel")} />
          <F label="Year" value={d.autoYear} onChange={s("autoYear")} />
          <F label="Plate Number" value={d.plateNumber} onChange={s("plateNumber")} />
          <F label="Owner of Vehicle" value={d.ownerOfVehicle} onChange={s("ownerOfVehicle")} />
          <F label="Owner Address" value={d.ownerAddress} onChange={s("ownerAddress")} />
          <F label="Owner City" value={d.ownerCity} onChange={s("ownerCity")} />
          <F label="Owner Phone" value={d.ownerPhone} onChange={s("ownerPhone")} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Third Party Insurance</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <F label="Insurance Company" value={d.insuranceCompany} onChange={s("insuranceCompany")} />
          <F label="Adjuster Name" value={d.adjusterName} onChange={s("adjusterName")} />
          <F label="Adjuster Phone" value={d.adjusterPhone} onChange={s("adjusterPhone")} />
          <F label="Adjuster Fax" value={d.adjusterFax} onChange={s("adjusterFax")} />
          <F label="Claim Number" value={d.claimNumber} onChange={s("claimNumber")} />
          <F label="Policy Number" value={d.policyNumber} onChange={s("policyNumber")} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Witnesses</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <F label="Witness 1 Name" value={d.witness1Name} onChange={s("witness1Name")} />
          <F label="Witness 1 Phone" value={d.witness1Phone} onChange={s("witness1Phone")} />
          <F label="Witness 2 Name" value={d.witness2Name} onChange={s("witness2Name")} />
          <F label="Witness 2 Phone" value={d.witness2Phone} onChange={s("witness2Phone")} />
        </CardContent>
      </Card>
      <div className="flex justify-end"><Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button></div>
    </div>
  );
}
