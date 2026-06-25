import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, maskSIN } from "@/lib/formatters";
import { Eye, EyeOff } from "lucide-react";
import { API_BASE_URL } from "@/lib/constants";

export default function ClientInfoTab({ caseId }: { caseId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showSIN, setShowSIN] = useState(false);
  const [sinValue, setSinValue] = useState("");

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      driverLicense: "", ohipNumber: "",
      sinNumber: "", citizenId: "", prCardNo: "", passportNo: "",
      child1Name: "", child1DOB: "", child2Name: "", child2DOB: "",
      child3Name: "", child3DOB: "", child4Name: "", child4DOB: "",
      child5Name: "", child5DOB: "", child6Name: "", child6DOB: "",
      finalSettlement: "0", ourFee: "0", rehabOutstanding: "0",
      assessmentOutstanding: "0", outstanding3: "0", outstanding4: "0",
      hst: "0", ourFeeHst: "0", payToClient: "0", ourFinalAccount: "0",
      hkName: "", hkAddress: "", hkCity: "", hkPostCode: "", hkPhone: "",
      cargName: "", cargAddress: "", cargCity: "", cargPostCode: "", cargPhone: "",
      atcName: "", atcAddress: "", atcCity: "", atcPostCode: "", atcPhone: "",
    },
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API_BASE_URL}/cases/${caseId}/client-info`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        reset(data);
        if (data.sinNumber) setSinValue(data.sinNumber);
      })
      .catch(() => toast({ title: "Failed to load client info", variant: "destructive" }))
      .finally(() => setFetching(false));
  }, [caseId]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/cases/${caseId}/client-info`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Client Info Saved" });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const F = ({ label, name, type = "text" }: { label: string; name: string; type?: string }) => (
    <div><Label className="text-xs">{label}</Label><Input {...register(name as any)} type={type} className="h-8 text-xs mt-1" /></div>
  );

  if (fetching) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;

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
