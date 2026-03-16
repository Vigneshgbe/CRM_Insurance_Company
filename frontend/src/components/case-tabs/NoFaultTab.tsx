import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { PROVINCES, CAR_MAKES } from "@/lib/constants";

export default function NoFaultTab({ caseId }: { caseId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      mvaCompany: "Aviva Canada", adjusterName: "Karen Thompson", adjusterEmail: "k.thompson@aviva.ca",
      mvaAddress: "100 King Street West", mvaCity: "Toronto", mvaProvince: "Ontario", mvaPostal: "M5X 1C9",
      mvaPhone: "4165551234", mvaFax: "4165551235", mvaSupervisor: "Mark Johnson",
      claimNo: "AVA-2024-789456", policyNo: "POL-456789", namedInsured: "James R Morrison",
      autoMake: "Toyota", autoModel: "Camry", autoYear: "2022", plateNumber: "ABCD 123",
      indCompany: "", indAdjuster: "", indAddress: "", indCity: "", indPostal: "",
      indPhone: "", indFax: "", indClaimNo: "", indSupervisor: "",
    },
  });

  const onSubmit = () => {
    setLoading(true);
    setTimeout(() => { toast({ title: "No Fault Info Saved" }); setLoading(false); }, 500);
  };

  const F = ({ label, name, type = "text" }: { label: string; name: string; type?: string }) => (
    <div><Label className="text-xs">{label}</Label><Input {...register(name as any)} type={type} className="h-8 text-xs mt-1" /></div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">MVA Company (First Party)</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <F label="Company Name" name="mvaCompany" />
              <F label="Adjuster Name" name="adjusterName" />
              <F label="Adjuster Email" name="adjusterEmail" />
              <F label="Address" name="mvaAddress" />
              <F label="City" name="mvaCity" />
              <div><Label className="text-xs">Province</Label>
                <Select value={watch("mvaProvince" as any)} onValueChange={(v) => setValue("mvaProvince" as any, v)}>
                  <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{PROVINCES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <F label="Postal Code" name="mvaPostal" />
              <F label="Phone" name="mvaPhone" />
              <F label="Fax" name="mvaFax" />
              <F label="Supervisor" name="mvaSupervisor" />
              <F label="Claim No" name="claimNo" />
              <F label="Policy No" name="policyNo" />
              <F label="Named Insured" name="namedInsured" />
              <div><Label className="text-xs">Auto Make</Label>
                <Select value={watch("autoMake" as any)} onValueChange={(v) => setValue("autoMake" as any, v)}>
                  <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{CAR_MAKES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <F label="Model" name="autoModel" />
              <F label="Year" name="autoYear" />
              <F label="Plate Number" name="plateNumber" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Independent Company (Second Party)</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <F label="Company Name" name="indCompany" />
              <F label="Adjuster" name="indAdjuster" />
              <F label="Address" name="indAddress" />
              <F label="City" name="indCity" />
              <F label="Postal Code" name="indPostal" />
              <F label="Phone" name="indPhone" />
              <F label="Fax" name="indFax" />
              <F label="Claim/File No" name="indClaimNo" />
              <F label="Supervisor" name="indSupervisor" />
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex justify-end mt-4">
        <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save No Fault Info"}</Button>
      </div>
    </form>
  );
}
