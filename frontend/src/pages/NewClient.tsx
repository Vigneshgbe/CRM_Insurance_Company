import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { PROVINCES, MARITAL_STATUSES, FILE_STATUSES } from "@/lib/constants";
import { generateFileNo, daysUntil } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

const STAFF = ["Amanda Singh", "John Baker", "Lisa Park", "Maria Costa"];
const MEDIATION_STATUSES = ["None", "Scheduled", "Completed", "Failed"];

export default function NewClient() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showSin, setShowSin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      firstName: "", lastName: "", initial: "", dateOfBirth: "", gender: "Male",
      maritalStatus: "Single", dependants: 0,
      address: "", city: "", province: "Ontario", postCode: "",
      homePhone: "", cellPhone: "", workPhone: "", email: "",
      driversLicense: "", dlCopy: false, healthCard: "", hcCopy: false,
      sin: "", sinCopy: false, prCitizen: "", idNumber: "", idCopy: false,
      fileNo: generateFileNo(), fileStatus: "Active",
      dateOfLoss: "", openDate: new Date().toISOString().split("T")[0],
      referredBy: "", clerkAssigned: "", secretary: "",
      limitationDate: "", mediationStatus: "None", arbitrationStatus: "None",
      mvaClientFault: "Unknown", thirdPartyLawyer: "", tortFileNo: "",
      benefitsClaiming: false, irbNonEarnerDue: false,
    },
  });

  const dob = watch("dateOfBirth");
  const limitationDate = watch("limitationDate");
  const fileNo = watch("fileNo");

  const age = dob ? Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;
  const limDays = limitationDate ? daysUntil(limitationDate) : null;

  const onSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      toast({ title: "Case Created", description: `Case ${fileNo} created successfully.` });
      navigate("/cases/1");
      setLoading(false);
    }, 800);
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="bg-muted/60 px-4 py-2 -mx-6 mb-4 mt-6 first:mt-0">
      <h3 className="text-sm font-semibold">{title}</h3>
    </div>
  );

  const Field = ({ label, name, type = "text", required = false, readOnly = false, className: cx = "" }: { label: string; name: string; type?: string; required?: boolean; readOnly?: boolean; className?: string }) => (
    <div className={cx}>
      <Label className="text-xs font-medium">{label}{required && <span className="text-destructive"> *</span>}</Label>
      <Input {...register(name as any, required ? { required: `${label} is required` } : {})} type={type} readOnly={readOnly} className="h-9 text-sm mt-1" />
      {(errors as any)[name] && <p className="text-xs text-destructive mt-0.5">{(errors as any)[name]?.message}</p>}
    </div>
  );

  const SelectField = ({ label, name, options, required = false }: { label: string; name: string; options: string[]; required?: boolean }) => (
    <div>
      <Label className="text-xs font-medium">{label}{required && <span className="text-destructive"> *</span>}</Label>
      <Select value={watch(name as any)} onValueChange={(v) => setValue(name as any, v)}>
        <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
        <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );

  return (
    <AppLayout title="New Client">
      <div className="max-w-4xl">
        {/* Step indicator */}
        <div className="flex gap-0 mb-6">
          <div className={cn("flex-1 py-2 px-4 text-sm font-medium text-center border-b-2", step === 1 ? "border-primary text-primary" : "border-border text-muted-foreground")}>
            Step 1: Client Info
          </div>
          <div className={cn("flex-1 py-2 px-4 text-sm font-medium text-center border-b-2", step === 2 ? "border-primary text-primary" : "border-border text-muted-foreground")}>
            Step 2: Case Details
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {step === 1 && (
            <Card>
              <CardContent className="p-6">
                <SectionHeader title="Personal Details" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="First Name" name="firstName" required />
                  <Field label="Last Name" name="lastName" required />
                  <Field label="Initial" name="initial" />
                  <Field label="Date of Birth" name="dateOfBirth" type="date" required />
                  <div>
                    <Label className="text-xs font-medium">Age</Label>
                    <Input value={age !== null ? String(age) : ""} readOnly className="h-9 text-sm mt-1 bg-muted" />
                  </div>
                  <SelectField label="Gender" name="gender" options={["Male", "Female", "Other"]} />
                  <SelectField label="Marital Status" name="maritalStatus" options={MARITAL_STATUSES} required />
                  <Field label="Number of Dependants" name="dependants" type="number" />
                </div>

                <SectionHeader title="Contact Information" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Address" name="address" required className="md:col-span-2" />
                  <Field label="City" name="city" required />
                  <SelectField label="Province" name="province" options={PROVINCES} required />
                  <Field label="Post Code" name="postCode" required />
                  <div />
                  <Field label="Home Phone" name="homePhone" />
                  <Field label="Cell Phone" name="cellPhone" required />
                  <Field label="Work Phone" name="workPhone" />
                  <Field label="Email" name="email" type="email" />
                </div>

                <SectionHeader title="Identification" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-end gap-2">
                    <div className="flex-1"><Field label="Driver's License No" name="driversLicense" /></div>
                    <label className="flex items-center gap-1 text-xs pb-2 cursor-pointer">
                      <Checkbox checked={watch("dlCopy" as any)} onCheckedChange={(v) => setValue("dlCopy" as any, !!v)} />Copy
                    </label>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1"><Field label="Health Card (OHIP) No" name="healthCard" /></div>
                    <label className="flex items-center gap-1 text-xs pb-2 cursor-pointer">
                      <Checkbox checked={watch("hcCopy" as any)} onCheckedChange={(v) => setValue("hcCopy" as any, !!v)} />Copy
                    </label>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label className="text-xs font-medium">SIN Number</Label>
                      <div className="relative mt-1">
                        <Input {...register("sin")} type={showSin ? "text" : "password"} className="h-9 text-sm pr-8" />
                        <button type="button" onClick={() => setShowSin(!showSin)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                          {showSin ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                    <label className="flex items-center gap-1 text-xs pb-2 cursor-pointer">
                      <Checkbox checked={watch("sinCopy" as any)} onCheckedChange={(v) => setValue("sinCopy" as any, !!v)} />Copy
                    </label>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <div className="grid grid-cols-2 gap-2">
                        <Field label="PR / Citizen" name="prCitizen" />
                        <Field label="ID Number" name="idNumber" />
                      </div>
                    </div>
                    <label className="flex items-center gap-1 text-xs pb-2 cursor-pointer">
                      <Checkbox checked={watch("idCopy" as any)} onCheckedChange={(v) => setValue("idCopy" as any, !!v)} />Copy
                    </label>
                  </div>
                </div>

                <div className="mt-8 flex justify-between">
                  <Button type="button" variant="ghost" onClick={() => navigate("/clients")}>Cancel</Button>
                  <Button type="button" onClick={() => setStep(2)}>Next: Case Details →</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardContent className="p-6">
                <SectionHeader title="File Information" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="File No" name="fileNo" required />
                  <SelectField label="File Status" name="fileStatus" options={FILE_STATUSES} required />
                  <Field label="Date of Loss/Accident" name="dateOfLoss" type="date" required />
                  <Field label="Open Date" name="openDate" type="date" required />
                </div>

                <SectionHeader title="Assignment" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Referred By" name="referredBy" />
                  <SelectField label="Clerk Assigned" name="clerkAssigned" options={STAFF} />
                  <SelectField label="Secretary" name="secretary" options={STAFF} />
                </div>

                <SectionHeader title="Legal Tracking" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Field label="Limitation Date" name="limitationDate" type="date" />
                    {limDays !== null && limDays >= 0 && limDays <= 30 && (
                      <p className="text-xs text-orange-500 mt-1">⚠ Limitation date is within {limDays} days</p>
                    )}
                  </div>
                  <SelectField label="Mediation Status" name="mediationStatus" options={MEDIATION_STATUSES} />
                  <SelectField label="Arbitration Status" name="arbitrationStatus" options={MEDIATION_STATUSES} />
                  <SelectField label="MVA Client Fault?" name="mvaClientFault" options={["Yes", "No", "Unknown"]} />
                  <Field label="Third Party Lawyer" name="thirdPartyLawyer" />
                  <Field label="Tort File No" name="tortFileNo" />
                </div>

                <SectionHeader title="Benefits" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between border rounded-md px-3 py-2">
                    <Label className="text-xs font-medium">Benefits Claiming</Label>
                    <Switch checked={watch("benefitsClaiming" as any)} onCheckedChange={(v) => setValue("benefitsClaiming" as any, v)} />
                  </div>
                  <div className="flex items-center justify-between border rounded-md px-3 py-2">
                    <Label className="text-xs font-medium">IRB/Non Earner Due</Label>
                    <Switch checked={watch("irbNonEarnerDue" as any)} onCheckedChange={(v) => setValue("irbNonEarnerDue" as any, v)} />
                  </div>
                </div>

                <div className="mt-8 flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>← Back</Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white" disabled={loading}>
                    {loading ? "Creating..." : "Create Case"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </form>
      </div>
    </AppLayout>
  );
}
