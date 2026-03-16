import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { getSettlementByCaseId } from "@/data/mockData";
import { formatCurrency } from "@/lib/formatters";

export default function SettlementTab({ caseId }: { caseId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const data = getSettlementByCaseId(caseId);
  const { register, handleSubmit, watch, setValue } = useForm({ defaultValues: data });

  const values = watch();

  useEffect(() => {
    const fs = Number(values.finalSettlement) || 0;
    const fee = Number(values.ourFee) || 0;
    const rehab = Number(values.rehabOutstanding) || 0;
    const assess = Number(values.assessmentOutstanding) || 0;
    const o3 = Number(values.outstanding3) || 0;
    const o4 = Number(values.outstanding4) || 0;
    const hst = Number(values.hst) || 0;
    const feeHst = Number(values.ourFeeHst) || 0;
    const pay = fs - fee - rehab - assess - o3 - o4 - hst;
    const finalAccount = fee + feeHst;
    setValue("payToClient", pay);
    setValue("ourFinalAccount", finalAccount);
  }, [values.finalSettlement, values.ourFee, values.rehabOutstanding, values.assessmentOutstanding, values.outstanding3, values.outstanding4, values.hst, values.ourFeeHst, setValue]);

  const onSubmit = () => {
    setLoading(true);
    setTimeout(() => { toast({ title: "Settlement Saved" }); setLoading(false); }, 500);
  };

  const F = ({ label, name, readOnly = false, highlight = false }: { label: string; name: string; readOnly?: boolean; highlight?: boolean }) => (
    <div className={highlight ? "p-2 rounded bg-success/10 border border-success/20" : ""}>
      <Label className={`text-xs ${highlight ? "text-success font-medium" : ""}`}>{label}</Label>
      <div className="relative mt-1">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
        <Input {...register(name as any)} type="number" className="h-8 text-xs pl-5" readOnly={readOnly} />
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Settlement Proposal</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl">
            <F label="Final Settlement Amount" name="finalSettlement" />
            <F label="Our Fee Herein" name="ourFee" />
            <F label="Rehab Outstanding" name="rehabOutstanding" />
            <F label="Assessment Outstanding" name="assessmentOutstanding" />
            <F label="Outstanding-3" name="outstanding3" />
            <F label="Outstanding-4" name="outstanding4" />
            <F label="HST" name="hst" />
            <F label="Our Fee HST" name="ourFeeHst" />
            <F label="Pay to Client" name="payToClient" readOnly highlight />
            <F label="Our Final Account Herein" name="ourFinalAccount" readOnly />
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end mt-4">
        <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Settlement"}</Button>
      </div>
    </form>
  );
}
