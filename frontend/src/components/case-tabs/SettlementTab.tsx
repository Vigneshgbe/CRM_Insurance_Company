import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { getSettlementByCaseId } from "@/data/mockData";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export default function SettlementTab({ caseId }: { caseId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const data = getSettlementByCaseId(caseId);
  const { register, handleSubmit, watch, setValue } = useForm({ defaultValues: data });

  const values = watch();

  const fs = Number(values.finalSettlement) || 0;
  const fee = Number(values.ourFee) || 0;
  const rehab = Number(values.rehabOutstanding) || 0;
  const assess = Number(values.assessmentOutstanding) || 0;
  const o3 = Number(values.outstanding3) || 0;
  const o4 = Number(values.outstanding4) || 0;
  const hst = Number(values.hst) || 0;
  const feeHst = Number(values.ourFeeHst) || 0;

  const totalDeductions = fee + rehab + assess + o3 + o4 + hst + feeHst;
  const payToClient = fs - totalDeductions;
  const finalAccount = fee + feeHst;

  useEffect(() => {
    setValue("payToClient", payToClient);
    setValue("ourFinalAccount", finalAccount);
  }, [payToClient, finalAccount, setValue]);

  const onSubmit = () => {
    setLoading(true);
    setTimeout(() => { toast({ title: "Settlement Saved" }); setLoading(false); }, 500);
  };

  const F = ({ label, name, readOnly = false, highlight = false }: { label: string; name: string; readOnly?: boolean; highlight?: boolean }) => (
    <div className={cn(highlight ? "p-3 rounded-lg bg-green-50 border border-green-200" : "")}>
      <Label className={cn("text-xs", highlight ? "text-green-700 font-semibold" : "")}>{label}</Label>
      <div className="relative mt-1">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
        <Input
          {...register(name as any)}
          type="number"
          className={cn("h-9 text-sm pl-6", readOnly ? "bg-muted" : "", highlight ? "text-green-700 font-bold text-base bg-green-50 border-green-300" : "")}
          readOnly={readOnly}
        />
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Settlement Proposal</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
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

      {/* Settlement Summary */}
      <Card className="mt-4">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold mb-4">Settlement Summary</h3>
          <div className="max-w-md space-y-2">
            <div className="flex justify-between text-sm">
              <span>Final Settlement:</span>
              <span className="font-medium">{formatCurrency(fs)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Total Deductions:</span>
              <span className="font-medium text-destructive">-{formatCurrency(totalDeductions)}</span>
            </div>
            <div className="border-t my-2" />
            <div className="flex justify-between text-lg font-bold text-green-700">
              <span>Pay to Client:</span>
              <span>{formatCurrency(payToClient)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 bg-background border-t py-3 mt-4 flex justify-end">
        <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Settlement"}</Button>
      </div>
    </form>
  );
}
