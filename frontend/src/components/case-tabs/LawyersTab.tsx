import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { LAW_FIRMS, LAWYERS, API_BASE_URL } from "@/lib/constants";

function LawFirmSection({ title, prefix, register, watch, setValue, highlight }: any) {
  const F = ({ label, name }: { label: string; name: string }) => (
    <div><Label className="text-xs">{label}</Label><Input {...register(`${prefix}${name}`)} className="h-8 text-xs mt-1" /></div>
  );
  const borderClass =
    highlight === "gold" ? "border-warning/50 bg-warning/5" :
    highlight === "pink" ? "border-destructive/30 bg-destructive/5" : "";
  return (
    <Card className={borderClass}>
      <CardHeader className="pb-2"><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><Label className="text-xs">Firm Name</Label>
            <Select value={watch(`${prefix}Firm`)} onValueChange={(v) => setValue(`${prefix}Firm`, v)}>
              <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{LAW_FIRMS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <F label="Address" name="Address" />
          <F label="City" name="City" />
          <F label="Postal Code" name="Postal" />
          <div><Label className="text-xs">Lawyer Name</Label>
            <Select value={watch(`${prefix}Lawyer`)} onValueChange={(v) => setValue(`${prefix}Lawyer`, v)}>
              <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{LAWYERS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <F label="Phone" name="Phone" />
          <F label="Fax" name="Fax" />
          <F label="Extension" name="Ext" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function LawyersTab({ caseId }: { caseId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { register, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: {
      ourFirm: "", ourAddress: "", ourCity: "", ourPostal: "",
      ourLawyer: "", ourPhone: "", ourFax: "", ourExt: "",
      prevFirm: "", prevAddress: "", prevCity: "", prevPostal: "",
      prevLawyer: "", prevPhone: "", prevFax: "", prevExt: "",
      transFirm: "", transAddress: "", transCity: "", transPostal: "",
      transLawyer: "", transPhone: "", transFax: "", transExt: "",
    },
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API_BASE_URL}/cases/${caseId}/lawyers`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => { reset(data); })
      .catch(() => toast({ title: "Failed to load lawyers data", variant: "destructive" }))
      .finally(() => setFetching(false));
  }, [caseId]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/cases/${caseId}/lawyers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Lawyers Info Saved" });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-4">
        <LawFirmSection title="Our Lawyer Firm" prefix="our" register={register} watch={watch} setValue={setValue} highlight="gold" />
        <LawFirmSection title="Previous Law Firm" prefix="prev" register={register} watch={watch} setValue={setValue} highlight="pink" />
        <LawFirmSection title="Transferred Law Firm" prefix="trans" register={register} watch={watch} setValue={setValue} />
      </div>
      <div className="flex justify-end mt-4">
        <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Lawyers Info"}</Button>
      </div>
    </form>
  );
}
