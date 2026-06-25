import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { JOB_DESCRIPTIONS, API_BASE_URL } from "@/lib/constants";

function EmployerSection({ title, prefix, register, watch, setValue }: any) {
  const F = ({ label, name }: { label: string; name: string }) => (
    <div><Label className="text-xs">{label}</Label><Input {...register(`${prefix}${name}`)} className="h-8 text-xs mt-1" /></div>
  );
  const YN = ({ label, name }: { label: string; name: string }) => (
    <div><Label className="text-xs">{label}</Label>
      <Select value={watch(`${prefix}${name}`)} onValueChange={(v) => setValue(`${prefix}${name}`, v)}>
        <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
      </Select>
    </div>
  );
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <F label="Employer Name" name="Name" />
          <F label="Address" name="Address" />
          <F label="City" name="City" />
          <F label="Postal Code" name="Postal" />
          <F label="Contact" name="Contact" />
          <F label="Phone (Main)" name="Phone" />
          <F label="Phone (Fax)" name="Fax" />
          <F label="Phone (Other)" name="PhoneOther" />
          <div><Label className="text-xs">Job Description</Label>
            <Select value={watch(`${prefix}JobDesc`)} onValueChange={(v) => setValue(`${prefix}JobDesc`, v)}>
              <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{JOB_DESCRIPTIONS.map((j) => <SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <F label="Job Title" name="JobTitle" />
          <F label="Salary" name="Salary" />
          <F label="Hours/Week" name="Hours" />
          <YN label="Extended Health Plan?" name="ExtHealth" />
          <F label="Health Insurance Name" name="HealthInsName" />
          <F label="Policy/Certificate No" name="HealthPolicyNo" />
          <YN label="STD Benefits?" name="STD" />
          <YN label="LTD Benefits?" name="LTD" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function EmploymentTab({ caseId }: { caseId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { register, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: {
      ftName: "", ftAddress: "", ftCity: "", ftPostal: "",
      ftContact: "", ftPhone: "", ftFax: "", ftPhoneOther: "",
      ftJobDesc: "", ftJobTitle: "", ftSalary: "", ftHours: "",
      ftExtHealth: "No", ftHealthInsName: "", ftHealthPolicyNo: "",
      ftSTD: "No", ftLTD: "No",
      ptName: "", ptAddress: "", ptCity: "", ptPostal: "",
      ptContact: "", ptPhone: "", ptFax: "", ptPhoneOther: "",
      ptJobDesc: "", ptJobTitle: "", ptSalary: "", ptHours: "",
      ptExtHealth: "No", ptHealthInsName: "", ptHealthPolicyNo: "",
      ptSTD: "No", ptLTD: "No",
    },
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API_BASE_URL}/cases/${caseId}/employment`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => { reset(data); })
      .catch(() => toast({ title: "Failed to load employment data", variant: "destructive" }))
      .finally(() => setFetching(false));
  }, [caseId]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/cases/${caseId}/employment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Employment Info Saved" });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EmployerSection title="Full-Time Employer" prefix="ft" register={register} watch={watch} setValue={setValue} />
        <EmployerSection title="Part-Time Employer" prefix="pt" register={register} watch={watch} setValue={setValue} />
      </div>
      <div className="flex justify-end mt-4">
        <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Employment Info"}</Button>
      </div>
    </form>
  );
}
