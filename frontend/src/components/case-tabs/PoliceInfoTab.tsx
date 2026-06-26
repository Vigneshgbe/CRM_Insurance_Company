import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/constants";

function getToken() {
  return localStorage.getItem("crm_token") || localStorage.getItem("token") || "";
}

export default function PoliceInfoTab({ caseId }: { caseId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const { register, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: {
      reportedDate: "No", reportOrdered: "No", reportOrderedDate: "",
      policeCentre: "", policeOfficer: "", badgeNumber: "",
      incidentNo: "", division: "", address: "",
      city: "", provincePC: "",
      requestDate: "", receivedDate: "",
      phone: "", intersection: "", timeOfAccident: "",
      accidentDescription: "",
    },
  });

  // ── Load real data from DB ─────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE_URL}/cases/${caseId}/police-info`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.ok ? r.json() : {})
      .then((data) => {
        if (data && Object.keys(data).length > 0) reset(data);
      })
      .catch(() => toast({ title: "Failed to load police info", variant: "destructive" }))
      .finally(() => setFetching(false));
  }, [caseId]);

  // ── Save to DB ─────────────────────────────────────────────────────────────
  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/cases/${caseId}/police-info`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Police Info Saved" });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const F = ({ label, name, type = "text" }: { label: string; name: string; type?: string }) => (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input {...register(name as any)} type={type} className="h-8 text-xs mt-1" />
    </div>
  );

  if (fetching) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Police Information</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Reported Date?</Label>
              <Select value={watch("reportedDate")} onValueChange={(v) => setValue("reportedDate", v)}>
                <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Report Ordered?</Label>
              <Select value={watch("reportOrdered")} onValueChange={(v) => setValue("reportOrdered", v)}>
                <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
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
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Police Info"}
        </Button>
      </div>
    </form>
  );
}
