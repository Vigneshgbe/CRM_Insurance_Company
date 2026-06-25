import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/formatters";

const API = "http://localhost:5000/api";
const token = () => localStorage.getItem("crm_token") || "";

const empty = { finalSettlement:0, ourFee:0, rehabOutstanding:0, assessmentOutstanding:0, outstanding3:0, outstanding4:0, hst:0, ourFeeHst:0, payToClient:0, ourFinalAccount:0 };

export default function SettlementTab({ caseId }: { caseId: string }) {
  const { toast } = useToast();
  const [d, setD] = useState<any>(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API}/cases/${caseId}/settlement`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.ok ? r.json() : null).then(r => { if (r) setD(r); });
  }, [caseId]);

  const n = (v: any) => parseFloat(v) || 0;

  function update(k: string, v: string) {
    setD((prev: any) => {
      const next = { ...prev, [k]: parseFloat(v) || 0 };
      const deductions = n(next.ourFee) + n(next.rehabOutstanding) + n(next.assessmentOutstanding) + n(next.outstanding3) + n(next.outstanding4) + n(next.hst) + n(next.ourFeeHst);
      next.payToClient = Math.max(0, n(next.finalSettlement) - deductions);
      next.ourFinalAccount = n(next.ourFee) + n(next.ourFeeHst);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    try {
      const r = await fetch(`${API}/cases/${caseId}/settlement`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(d),
      });
      if (!r.ok) throw new Error();
      toast({ title: "Settlement saved" });
    } catch { toast({ title: "Save failed", variant: "destructive" }); }
    finally { setSaving(false); }
  }

  const Field = ({ label, field, readOnly }: { label: string; field: string; readOnly?: boolean }) => (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        type="number" step="0.01" min="0"
        value={d[field] || 0}
        onChange={e => update(field, e.target.value)}
        readOnly={readOnly}
        className={`mt-1 h-9 text-sm ${readOnly ? "bg-muted font-medium" : ""}`}
      />
    </div>
  );

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Settlement Amounts</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <Field label="Final Settlement" field="finalSettlement" />
          <Field label="Our Fee" field="ourFee" />
          <Field label="Rehab Outstanding" field="rehabOutstanding" />
          <Field label="Assessment Outstanding" field="assessmentOutstanding" />
          <Field label="Other Outstanding 1" field="outstanding3" />
          <Field label="Other Outstanding 2" field="outstanding4" />
          <Field label="HST" field="hst" />
          <Field label="Our Fee + HST" field="ourFeeHst" />
        </CardContent>
      </Card>
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-primary">Calculated Totals</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Pay to Client</Label>
            <p className="text-lg font-bold text-primary mt-1">{formatCurrency(d.payToClient)}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Our Final Account</Label>
            <p className="text-lg font-bold text-primary mt-1">{formatCurrency(d.ourFinalAccount)}</p>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end"><Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Settlement"}</Button></div>
    </div>
  );
}
