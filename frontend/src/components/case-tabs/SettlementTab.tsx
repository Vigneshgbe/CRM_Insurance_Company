import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { settlementApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Props { caseId: string; }

const defaultData = {
  finalSettlement: 0, ourFee: 0, rehabOutstanding: 0,
  assessmentOutstanding: 0, outstanding3: 0, outstanding4: 0,
  hst: 0, ourFeeHst: 0, payToClient: 0, ourFinalAccount: 0,
};

function currency(n: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n);
}

export default function SettlementTab({ caseId }: Props) {
  const { toast } = useToast();
  const [data, setData] = useState(defaultData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settlementApi.getByCaseId(caseId)
      .then((d) => setData({ ...defaultData, ...d }))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [caseId]);

  // Auto-compute payToClient and ourFinalAccount
  function computed() {
    const deductions = data.ourFee + data.rehabOutstanding + data.assessmentOutstanding +
      data.outstanding3 + data.outstanding4 + data.hst + data.ourFeeHst;
    const payToClient = data.finalSettlement - deductions;
    const ourFinalAccount = data.ourFee + data.ourFeeHst;
    return { payToClient, ourFinalAccount };
  }

  function set(field: string, val: string) {
    setData((prev) => ({ ...prev, [field]: parseFloat(val) || 0 }));
  }

  async function handleSave() {
    const { payToClient, ourFinalAccount } = computed();
    setSaving(true);
    try {
      const saved = await settlementApi.upsert(caseId, { ...data, payToClient, ourFinalAccount });
      setData({ ...defaultData, ...saved });
      toast({ title: "Settlement saved" });
    } catch (err) {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally { setSaving(false); }
  }

  const { payToClient, ourFinalAccount } = computed();

  const fields: { label: string; key: string; computed?: boolean }[] = [
    { label: "Final Settlement Amount", key: "finalSettlement" },
    { label: "Our Fee", key: "ourFee" },
    { label: "Rehab Outstanding", key: "rehabOutstanding" },
    { label: "Assessment Outstanding", key: "assessmentOutstanding" },
    { label: "Outstanding (Other 1)", key: "outstanding3" },
    { label: "Outstanding (Other 2)", key: "outstanding4" },
    { label: "HST", key: "hst" },
    { label: "Our Fee + HST", key: "ourFeeHst" },
  ];

  if (loading) return <p className="p-4 text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-medium mb-4">Settlement Proposal</h3>
        <div className="grid grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.key}>
              <Label className="text-xs">{f.label}</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={(data as any)[f.key]}
                  onChange={(e) => set(f.key, e.target.value)}
                  className="pl-6"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Computed fields */}
        <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Pay to Client</p>
            <p className="text-xl font-bold text-blue-700">{currency(payToClient)}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Our Final Account</p>
            <p className="text-xl font-bold text-green-700">{currency(ourFinalAccount)}</p>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Settlement"}
          </Button>
        </div>
      </div>
    </div>
  );
}
