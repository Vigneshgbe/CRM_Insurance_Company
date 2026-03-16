import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PROVINCES, MARITAL_STATUSES, FILE_STATUSES } from "@/lib/constants";
import { generateFileNo } from "@/lib/formatters";

export default function NewClient() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      firstName: "", lastName: "", initial: "", address: "", city: "", province: "Ontario", postCode: "",
      homePhone: "", cellPhone: "", workPhone: "", email: "", dateOfBirth: "", maritalStatus: "Single", dependants: 0,
      fileNo: generateFileNo(), fileStatus: "Active", dateOfLoss: "", openDate: new Date().toISOString().split("T")[0],
      referredBy: "", clerkAssigned: "", secretary: "", limitationDate: "", mediationStatus: "N/A",
      arbitrationStatus: "N/A", mvaClientFault: "No", benefitsClaiming: "No", irbNonEarnerDue: "No",
      thirdPartyLawyer: "", tortFileNo: "", closedFileNo: "",
    },
  });

  const onSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      toast({ title: "Case Created", description: "New client and case have been created successfully." });
      navigate("/cases/1");
      setLoading(false);
    }, 800);
  };

  const Field = ({ label, name, type = "text", required = false, span = 1 }: { label: string; name: string; type?: string; required?: boolean; span?: number }) => (
    <div className={span === 2 ? "col-span-2" : ""}>
      <Label className="text-xs font-medium">{label}{required && " *"}</Label>
      <Input {...register(name as any, required ? { required: `${label} is required` } : {})} type={type} className="h-9 text-sm mt-1" />
      {(errors as any)[name] && <p className="text-xs text-destructive mt-0.5">{(errors as any)[name]?.message}</p>}
    </div>
  );

  const SelectField = ({ label, name, options }: { label: string; name: string; options: string[] }) => (
    <div>
      <Label className="text-xs font-medium">{label}</Label>
      <Select value={watch(name as any)} onValueChange={(v) => setValue(name as any, v)}>
        <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <AppLayout title="New Client">
      <div className="max-w-4xl">
        <div className="flex gap-2 mb-6">
          <Button variant={step === 1 ? "default" : "outline"} size="sm" onClick={() => setStep(1)}>Step 1: Client Info</Button>
          <Button variant={step === 2 ? "default" : "outline"} size="sm" onClick={() => setStep(2)}>Step 2: Case Info</Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {step === 1 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Client Basic Information</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="First Name" name="firstName" required />
                  <Field label="Last Name" name="lastName" required />
                  <Field label="Initial" name="initial" />
                  <Field label="Address" name="address" span={2} />
                  <Field label="City" name="city" />
                  <SelectField label="Province" name="province" options={PROVINCES} />
                  <Field label="Postal Code" name="postCode" />
                  <div />
                  <Field label="Home Phone" name="homePhone" />
                  <Field label="Cell Phone" name="cellPhone" required />
                  <Field label="Work Phone" name="workPhone" />
                  <Field label="Email" name="email" type="email" required />
                  <Field label="Date of Birth" name="dateOfBirth" type="date" />
                  <SelectField label="Marital Status" name="maritalStatus" options={MARITAL_STATUSES} />
                  <Field label="Number of Dependants" name="dependants" type="number" />
                </div>
                <div className="mt-6 flex justify-end">
                  <Button type="button" onClick={() => setStep(2)}>Next: Case Info →</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Case Information</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="File No" name="fileNo" />
                  <SelectField label="File Status" name="fileStatus" options={FILE_STATUSES} />
                  <Field label="Date of Loss/Accident" name="dateOfLoss" type="date" required />
                  <Field label="Open Date" name="openDate" type="date" />
                  <Field label="Referred By" name="referredBy" />
                  <Field label="Clerk Assigned" name="clerkAssigned" />
                  <Field label="Secretary" name="secretary" />
                  <Field label="Limitation Date" name="limitationDate" type="date" />
                  <Field label="Mediation Status" name="mediationStatus" />
                  <Field label="Arbitration Status" name="arbitrationStatus" />
                  <SelectField label="MVA Client Fault?" name="mvaClientFault" options={["Yes", "No"]} />
                  <SelectField label="Benefits Claiming?" name="benefitsClaiming" options={["Yes", "No"]} />
                  <SelectField label="IRB/Non Earner Due?" name="irbNonEarnerDue" options={["Yes", "No"]} />
                  <Field label="Third Party Lawyer" name="thirdPartyLawyer" />
                  <Field label="Tort File No" name="tortFileNo" />
                  <Field label="Closed File No" name="closedFileNo" />
                </div>
                <div className="mt-6 flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>← Back</Button>
                  <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Case"}</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </form>
      </div>
    </AppLayout>
  );
}
