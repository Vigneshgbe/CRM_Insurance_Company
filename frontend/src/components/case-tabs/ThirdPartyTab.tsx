import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function ThirdPartyTab({ caseId }: { caseId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm({
    defaultValues: {
      driverName: "Robert Chen", driverAddress: "55 Eglinton Ave E", driverCity: "Toronto",
      driverProvPC: "Ontario M4P 1G8", homePhone: "4165559876", workPhone: "4165558765",
      employerName: "Metro Logistics", workAddress: "200 Front St", workCity: "Toronto", workProvPC: "Ontario M5V 3K2",
      driverLicense: "C4567-89012-30415", driverDOB: "1990-04-22",
      autoMake: "Honda", autoModel: "Civic", autoYear: "2021", plateNumber: "WXYZ 789",
      vehicleOwner: "Robert Chen", ownerAddress: "55 Eglinton Ave E", ownerCity: "Toronto", ownerPostal: "M4P 1G8", ownerPhone: "4165559876",
      insuranceCompany: "Intact Insurance", insAddress: "700 University Ave", insCity: "Toronto", insPostal: "M5G 0A1",
      insAdjuster: "Patricia Lee", insPhone: "4165554321", insFax: "4165554322", insExt: "245",
      insClaimNo: "INT-2024-567890", insPolicyNo: "POL-INT-123456",
      witness1Name: "Sarah Miller", witness1Phone: "4165551111",
      witness2Name: "Tom Garcia", witness2Phone: "4165552222",
    },
  });

  const onSubmit = () => {
    setLoading(true);
    setTimeout(() => { toast({ title: "Third Party Info Saved" }); setLoading(false); }, 500);
  };

  const F = ({ label, name }: { label: string; name: string }) => (
    <div><Label className="text-xs">{label}</Label><Input {...register(name as any)} className="h-8 text-xs mt-1" /></div>
  );

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
