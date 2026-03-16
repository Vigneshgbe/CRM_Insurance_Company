import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, maskSIN } from "@/lib/formatters";
import { Eye, EyeOff } from "lucide-react";

export default function ClientInfoTab({ caseId }: { caseId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showSIN, setShowSIN] = useState(false);
  const { register, handleSubmit } = useForm({
    defaultValues: {
      driverLicense: "M1234-56789-01234", ohipNumber: "1234-567-890-AB",
      sinNumber: "123456789", citizenId: "", prCardNo: "", passportNo: "GA123456",
      child1Name: "Emma Morrison", child1DOB: "2015-03-22",
      child2Name: "Liam Morrison", child2DOB: "2018-09-10",
      child3Name: "", child3DOB: "", child4Name: "", child4DOB: "",
      child5Name: "", child5DOB: "", child6Name: "", child6DOB: "",
      finalSettlement: "0", ourFee: "0", rehabOutstanding: "2500",
      assessmentOutstanding: "1800", outstanding3: "0", outstanding4: "0",
      hst: "0", ourFeeHst: "0", payToClient: "0", ourFinalAccount: "0",
      hkName: "", hkAddress: "", hkCity: "", hkPostCode: "", hkPhone: "",
      cargName: "", cargAddress: "", cargCity: "", cargPostCode: "", cargPhone: "",
      atcName: "Maria Santos", atcAddress: "45 Dundas St", atcCity: "Toronto", atcPostCode: "M5B 1C6", atcPhone: "4165553456",
    },
  });

  const onSubmit = () => {
    setLoading(true);
    setTimeout(() => { toast({ title: "Client Info Saved" }); setLoading(false); }, 500);
  };

  const F = ({ label, name, type = "text" }: { label: string; name: string; type?: string }) => (
    <div><Label className="text-xs">{label}</Label><Input {...register(name as any)} type={type} className="h-8 text-xs mt-1" /></div>
  );

  const sinValue = "123456789";

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Identification</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <F label="Driver's License No" name="driverLicense" />
                <F label="OHIP Number" name="ohipNumber" />
                <div>
                  <Label className="text-xs">SIN Number</Label>
                  <div className="flex gap-1 mt-1">
                    <Input value={showSIN ? sinValue : maskSIN(sinValue)} readOnly className="h-8 text-xs" />
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setShowSIN(!showSIN)}>
                      {showSIN ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
                <F label="Citizen ID" name="citizenId" />
                <F label="PR Card No" name="prCardNo" />
                <F label="Passport No" name="passportNo" />
              </div>
              <div className="mt-4">
                <Label className="text-xs font-medium">Children</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex gap-2">
                      <Input {...register(`child${i}Name` as any)} placeholder={`Child ${i} Name`} className="h-8 text-xs" />
                      <Input {...register(`child${i}DOB` as any)} type="date" className="h-8 text-xs w-32" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Financial Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <F label="Final Settlement Amount ($)" name="finalSettlement" />
                <F label="Our Fee Herein ($)" name="ourFee" />
                <F label="Rehab Outstanding ($)" name="rehabOutstanding" />
                <F label="Assessment Outstanding ($)" name="assessmentOutstanding" />
                <F label="Outstanding-3 ($)" name="outstanding3" />
                <F label="Outstanding-4 ($)" name="outstanding4" />
                <F label="HST ($)" name="hst" />
                <F label="Our Fee HST ($)" name="ourFeeHst" />
                <div className="p-2 rounded bg-success/10 border border-success/20">
                  <Label className="text-xs text-success">Pay to Client ($)</Label>
                  <Input {...register("payToClient" as any)} className="h-8 text-xs mt-1 border-success/30" readOnly />
                </div>
                <F label="Our Final Account ($)" name="ourFinalAccount" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Related Contacts</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: "H/K (Housekeeper)", prefix: "hk" },
                { title: "CARG (Caregiver)", prefix: "carg" },
                { title: "ATC (Attendant Care)", prefix: "atc" },
              ].map(({ title, prefix }) => (
                <div key={prefix}>
                  <Label className="text-xs font-medium">{title}</Label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-1">
                    <Input {...register(`${prefix}Name` as any)} placeholder="Name" className="h-8 text-xs" />
                    <Input {...register(`${prefix}Address` as any)} placeholder="Address" className="h-8 text-xs" />
                    <Input {...register(`${prefix}City` as any)} placeholder="City" className="h-8 text-xs" />
                    <Input {...register(`${prefix}PostCode` as any)} placeholder="Post Code" className="h-8 text-xs" />
                    <Input {...register(`${prefix}Phone` as any)} placeholder="Phone" className="h-8 text-xs" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Client Info"}</Button>
        </div>
      </div>
    </form>
  );
}
