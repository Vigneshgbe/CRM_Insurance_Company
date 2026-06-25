import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { ASSESSMENT_COMPANIES, PROVINCES, API_BASE_URL } from "@/lib/constants";
function getToken() {
  return localStorage.getItem("crm_token") || localStorage.getItem("token") || "";
}


export default function SpecialistTab({ caseId }: { caseId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { register, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: {
      company: "", address: "", city: "",
      province: "Ontario", postCode: "", phone: "", fax: "",
    },
  });

  useEffect(() => {
    const token = getToken();
    fetch(`${API_BASE_URL}/cases/${caseId}/specialist`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => { reset(data); })
      .catch(() => toast({ title: "Failed to load specialist data", variant: "destructive" }))
      .finally(() => setFetching(false));
  }, [caseId]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/cases/${caseId}/specialist`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Specialist Info Saved" });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Specialist / Assessment Company</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-3xl">
            <div><Label className="text-xs">Assessment Company</Label>
              <Select value={watch("company")} onValueChange={(v) => setValue("company", v)}>
                <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{ASSESSMENT_COMPANIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Address</Label><Input {...register("address")} className="h-8 text-xs mt-1" /></div>
            <div><Label className="text-xs">City</Label><Input {...register("city")} className="h-8 text-xs mt-1" /></div>
            <div><Label className="text-xs">Province</Label>
              <Select value={watch("province")} onValueChange={(v) => setValue("province", v)}>
                <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{PROVINCES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Post Code</Label><Input {...register("postCode")} className="h-8 text-xs mt-1" /></div>
            <div><Label className="text-xs">Phone</Label><Input {...register("phone")} className="h-8 text-xs mt-1" /></div>
            <div><Label className="text-xs">Fax</Label><Input {...register("fax")} className="h-8 text-xs mt-1" /></div>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end mt-4">
        <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Specialist Info"}</Button>
      </div>
    </form>
  );
}
