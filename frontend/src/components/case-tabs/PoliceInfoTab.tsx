import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { PROVINCES } from "@/lib/constants";

export default function PoliceInfoTab({ caseId }: { caseId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      reportedDate: "Yes", reportOrdered: "Yes", reportOrderedDate: "2024-07-01",
      policeCentre: "Toronto Police Service", policeOfficer: "Const. M. Roberts", badgeNumber: "4521",
      incidentNo: "TPS-2024-45678", division: "Traffic Services", address: "40 College St",
      city: "Toronto", provincePC: "Ontario M5G 2J3",
      requestDate: "2024-06-20", receivedDate: "2024-07-15",
      phone: "4168082222", intersection: "Highway 401 & Yonge Street", timeOfAccident: "14:30",
      accidentDescription: "Two-vehicle collision on Highway 401 westbound. Vehicle 1 (client) struck by Vehicle 2 which changed lanes without signalling. V2 driver charged with careless driving.",
    },
  });

  const onSubmit = () => {
    setLoading(true);
    setTimeout(() => { toast({ title: "Police Info Saved" }); setLoading(false); }, 500);
  };

  const F = ({ label, name, type = "text" }: { label: string; name: string; type?: string }) => (
    <div><Label className="text-xs">{label}</Label><Input {...register(name as any)} type={type} className="h-8 text-xs mt-1" /></div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Police Information</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><Label className="text-xs">Reported Date?</Label>
              <Select value={watch("reportedDate" as any)} onValueChange={(v) => setValue("reportedDate" as any, v)}>
                <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Report Ordered?</Label>
              <Select value={watch("reportOrdered" as any)} onValueChange={(v) => setValue("reportOrdered" as any, v)}>
                <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
              </Select>
            </div>
            <F label="Report Ordered Date" name="reportOrderedDate" type="date" />
            <F label="Police/Centre" name="policeCentre" />
            <F label="Police Officer" name="policeOfficer" />
            <F label="Badge Number" name="badgeNumber" />
            <F label="Incident No" name="incidentNo" />
            <F label="Division" name="division" />
            <F label="Address" name="address" />
            <F label="City" name="city" />
            <F label="Province/PC" name="provincePC" />
            <F label="Request Date" name="requestDate" type="date" />
            <F label="Received" name="receivedDate" type="date" />
            <F label="Phone" name="phone" />
            <F label="Intersection" name="intersection" />
            <F label="Time of Accident" name="timeOfAccident" type="time" />
          </div>
          <div className="mt-3">
            <Label className="text-xs">Description of Accident</Label>
            <Textarea {...register("accidentDescription")} rows={4} className="text-xs mt-1" />
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end mt-4">
        <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Police Info"}</Button>
      </div>
    </form>
  );
}
