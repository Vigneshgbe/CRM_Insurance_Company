import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/constants";
function getToken() {
  return localStorage.getItem("crm_token") || localStorage.getItem("token") || "";
}


export default function ThirdPartyTab({ caseId }: { caseId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      driverName: "", driverAddress: "", driverCity: "",
      driverProvPC: "", homePhone: "", workPhone: "",
      employerName: "", workAddress: "", workCity: "", workProvPC: "",
      driverLicense: "", driverDOB: "",
      autoMake: "", autoModel: "", autoYear: "", plateNumber: "",
      vehicleOwner: "", ownerAddress: "", ownerCity: "", ownerPostal: "", ownerPhone: "",
      insuranceCompany: "", insAddress: "", insCity: "", insPostal: "",
      insAdjuster: "", insPhone: "", insFax: "", insExt: "",
      insClaimNo: "", insPolicyNo: "",
      witness1Name: "", witness1Phone: "",
      witness2Name: "", witness2Phone: "",
    },
  });

  useEffect(() => {
    const token = getToken();
    fetch(`${API_BASE_URL}/cases/${caseId}/third-party`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => { reset(data); })
      .catch(() => toast({ title: "Failed to load third party data", variant: "destructive" }))
      .finally(() => setFetching(false));
  }, [caseId]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/cases/${caseId}/third-party`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Third Party Info Saved" });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const F = ({ label, name }: { label: string; name: string }) => (
    <div><Label className="text-xs">{label}</Label><Input {...register(name as any)} className="h-8 text-xs mt-1" /></div>
  );

  if (fetching) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Driver Information</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <F label="Driver Name" name="driverName" />
              <F label="Address" name="driverAddress" />
              <F label="City" name="driverCity" />
              <F label="Province/PC" name="driverProvPC" />
              <F label="Home Phone" name="homePhone" />
              <F label="Work Phone" name="workPhone" />
              <F label="Employer Name" name="employerName" />
              <F label="Work Address" name="workAddress" />
              <F label="City" name="workCity" />
              <F label="Province/PC" name="workProvPC" />
              <F label="Driver's License No" name="driverLicense" />
              <F label="Date of Birth" name="driverDOB" />
              <F label="Auto Make" name="autoMake" />
              <F label="Model" name="autoModel" />
              <F label="Year" name="autoYear" />
              <F label="Plate Number" name="plateNumber" />
              <F label="Owner of Vehicle" name="vehicleOwner" />
              <F label="Owner Address" name="ownerAddress" />
              <F label="City" name="ownerCity" />
              <F label="Postal Code" name="ownerPostal" />
              <F label="Phone" name="ownerPhone" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Third Party Insurance</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <F label="Insurance Company" name="insuranceCompany" />
              <F label="Address" name="insAddress" />
              <F label="City" name="insCity" />
              <F label="Postal Code" name="insPostal" />
              <F label="Adjuster Name" name="insAdjuster" />
              <F label="Phone" name="insPhone" />
              <F label="Fax" name="insFax" />
              <F label="Extension" name="insExt" />
              <F label="Claim Number" name="insClaimNo" />
              <F label="Policy Number" name="insPolicyNo" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Witnesses</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <F label="Witness 1 Name" name="witness1Name" />
            <F label="Phone" name="witness1Phone" />
            <F label="Witness 2 Name" name="witness2Name" />
            <F label="Phone" name="witness2Phone" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end mt-4">
        <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Third Party Info"}</Button>
      </div>
    </form>
  );
}
