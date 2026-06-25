import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { clientsApi, casesApi } from "@/lib/api";

const PROVINCES = [
  "Alberta","British Columbia","Manitoba","New Brunswick",
  "Newfoundland and Labrador","Northwest Territories","Nova Scotia",
  "Nunavut","Ontario","Prince Edward Island","Quebec","Saskatchewan","Yukon",
];

const MARITAL_STATUSES = ["Single","Married","Common-Law","Separated","Divorced","Widow"];
const FILE_STATUSES = ["Active","Closed","Pending","On Hold","Settled","Litigation","Mediation","Arbitration"];
const CASE_TYPES = ["Motor Vehicle Accident (MVA)","Slip and Fall","Traffic Accident","Immigration"];
const STAFF = ["Vignesh G","Amanda Singh","John Baker","Lisa Park","Sarah Connor","Michael Ross"];

export default function NewClient() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [createdClientId, setCreatedClientId] = useState<string | null>(null);

  // Step 1 — Personal & Contact
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [initial, setInitial] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [dependants, setDependants] = useState("0");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("Ontario");
  const [postCode, setPostCode] = useState("");
  const [homePhone, setHomePhone] = useState("");
  const [cellPhone, setCellPhone] = useState("");
  const [workPhone, setWorkPhone] = useState("");
  const [email, setEmail] = useState("");
  // ID docs
  const [dlNumber, setDlNumber] = useState("");
  const [dlCopy, setDlCopy] = useState(false);
  const [healthCard, setHealthCard] = useState("");
  const [healthCardCopy, setHealthCardCopy] = useState(false);
  const [sinNumber, setSinNumber] = useState("");
  const [sinCopy, setSinCopy] = useState(false);

  // Step 2 — Case Info
  const [fileStatus, setFileStatus] = useState("Active");
  const [caseType, setCaseType] = useState("Motor Vehicle Accident (MVA)");
  const [dateOfLoss, setDateOfLoss] = useState("");
  const [openDate, setOpenDate] = useState(new Date().toISOString().slice(0, 10));
  const [referredBy, setReferredBy] = useState("");
  const [clerkAssigned, setClerkAssigned] = useState("");
  const [secretary, setSecretary] = useState("");
  const [limitationDate, setLimitationDate] = useState("");
  const [mediationStatus, setMediationStatus] = useState("N/A");
  const [arbitrationStatus, setArbitrationStatus] = useState("N/A");
  const [mvaClientFault, setMvaClientFault] = useState("No");
  const [thirdPartyLawyer, setThirdPartyLawyer] = useState("");
  const [tortFileNo, setTortFileNo] = useState("");
  const [benefitsClaiming, setBenefitsClaiming] = useState(false);
  const [irbNonEarnerDue, setIrbNonEarnerDue] = useState(false);

  async function handleStep1Next() {
    if (!firstName.trim() || !lastName.trim()) {
      toast({ title: "First Name and Last Name are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const client = await clientsApi.create({
        firstName, lastName, initial, dateOfBirth: dateOfBirth || null,
        maritalStatus, dependants: parseInt(dependants) || 0,
        address, city, province, postCode,
        homePhone, cellPhone, workPhone, email,
      });
      setCreatedClientId(client.id);
      setStep(2);
    } catch (err: any) {
      toast({ title: err.message || "Failed to save client", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleStep2Submit() {
    if (!createdClientId) return;
    if (!caseType) {
      toast({ title: "Case type is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const newCase = await casesApi.create({
        clientId: createdClientId,
        fileStatus,
        caseType,
        dateOfLoss: dateOfLoss || null,
        openDate: openDate || null,
        referredBy,
        clerkAssigned,
        secretary,
        limitationDate: limitationDate || null,
        mediationStatus,
        arbitrationStatus,
        mvaClientFault,
        thirdPartyLawyer,
        tortFileNo,
        benefitsClaiming: benefitsClaiming ? "Yes" : "No",
        irbNonEarnerDue: irbNonEarnerDue ? "Yes" : "No",
      });
      toast({ title: "Case Created", description: `Case ${newCase.fileNo} created successfully.` });
      navigate(`/cases/${newCase.id}`);
    } catch (err: any) {
      toast({ title: err.message || "Failed to create case", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout title="New Client">
      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`flex items-center gap-2 text-sm font-medium ${step === 1 ? "text-primary" : "text-muted-foreground"}`}>
          <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>1</span>
          Personal Information
        </div>
        <div className="h-px flex-1 bg-border" />
        <div className={`flex items-center gap-2 text-sm font-medium ${step === 2 ? "text-primary" : "text-muted-foreground"}`}>
          <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>2</span>
          Case File Information
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Personal Information</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2 md:col-span-1">
                <Label className="text-xs">First Name *</Label>
                <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" className="mt-1 h-9" />
              </div>
              <div className="col-span-2 md:col-span-1">
                <Label className="text-xs">Last Name *</Label>
                <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" className="mt-1 h-9" />
              </div>
              <div>
                <Label className="text-xs">Initial</Label>
                <Input value={initial} onChange={e => setInitial(e.target.value)} placeholder="M" maxLength={5} className="mt-1 h-9" />
              </div>
              <div>
                <Label className="text-xs">Date of Birth</Label>
                <Input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className="mt-1 h-9" />
              </div>
              <div>
                <Label className="text-xs">Gender</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Marital Status</Label>
                <Select value={maritalStatus} onValueChange={setMaritalStatus}>
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {MARITAL_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Dependants</Label>
                <Input type="number" min="0" value={dependants} onChange={e => setDependants(e.target.value)} className="mt-1 h-9" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Contact Information</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label className="text-xs">Street Address</Label>
                <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Street address" className="mt-1 h-9" />
              </div>
              <div>
                <Label className="text-xs">City</Label>
                <Input value={city} onChange={e => setCity(e.target.value)} placeholder="City" className="mt-1 h-9" />
              </div>
              <div>
                <Label className="text-xs">Province</Label>
                <Select value={province} onValueChange={setProvince}>
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Postal Code</Label>
                <Input value={postCode} onChange={e => setPostCode(e.target.value)} placeholder="A1A 1A1" className="mt-1 h-9" />
              </div>
              <div>
                <Label className="text-xs">Home Phone</Label>
                <Input value={homePhone} onChange={e => setHomePhone(e.target.value)} placeholder="(416) 555-0100" className="mt-1 h-9" />
              </div>
              <div>
                <Label className="text-xs">Cell Phone</Label>
                <Input value={cellPhone} onChange={e => setCellPhone(e.target.value)} placeholder="(416) 555-0101" className="mt-1 h-9" />
              </div>
              <div>
                <Label className="text-xs">Work Phone</Label>
                <Input value={workPhone} onChange={e => setWorkPhone(e.target.value)} placeholder="(416) 555-0102" className="mt-1 h-9" />
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="client@email.com" className="mt-1 h-9" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Identification Documents</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <Label className="text-xs">Driver's License No.</Label>
                  <Input value={dlNumber} onChange={e => setDlNumber(e.target.value)} placeholder="DL number" className="mt-1 h-9" />
                </div>
                <div className="flex items-center gap-2 pb-1">
                  <Checkbox id="dlCopy" checked={dlCopy} onCheckedChange={v => setDlCopy(v as boolean)} />
                  <Label htmlFor="dlCopy" className="text-xs">Copy obtained</Label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <Label className="text-xs">Health Card No. (OHIP)</Label>
                  <Input value={healthCard} onChange={e => setHealthCard(e.target.value)} placeholder="Health card number" className="mt-1 h-9" />
                </div>
                <div className="flex items-center gap-2 pb-1">
                  <Checkbox id="hcCopy" checked={healthCardCopy} onCheckedChange={v => setHealthCardCopy(v as boolean)} />
                  <Label htmlFor="hcCopy" className="text-xs">Copy obtained</Label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <Label className="text-xs">SIN Number</Label>
                  <Input value={sinNumber} onChange={e => setSinNumber(e.target.value)} placeholder="SIN (confidential)" type="password" className="mt-1 h-9" />
                </div>
                <div className="flex items-center gap-2 pb-1">
                  <Checkbox id="sinCopy" checked={sinCopy} onCheckedChange={v => setSinCopy(v as boolean)} />
                  <Label htmlFor="sinCopy" className="text-xs">Copy obtained</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate("/clients")}>Cancel</Button>
            <Button onClick={handleStep1Next} disabled={saving}>
              {saving ? "Saving..." : "Next: Case Information →"}
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">File Information</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">File Status</Label>
                <Select value={fileStatus} onValueChange={setFileStatus}>
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FILE_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Case Type</Label>
                <Select value={caseType} onValueChange={setCaseType}>
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CASE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Date of Loss</Label>
                <Input type="date" value={dateOfLoss} onChange={e => setDateOfLoss(e.target.value)} className="mt-1 h-9" />
              </div>
              <div>
                <Label className="text-xs">Open Date</Label>
                <Input type="date" value={openDate} onChange={e => setOpenDate(e.target.value)} className="mt-1 h-9" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Assignment</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Referred By</Label>
                <Input value={referredBy} onChange={e => setReferredBy(e.target.value)} placeholder="Referral source" className="mt-1 h-9" />
              </div>
              <div>
                <Label className="text-xs">Clerk Assigned</Label>
                <Select value={clerkAssigned} onValueChange={setClerkAssigned}>
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Select clerk" /></SelectTrigger>
                  <SelectContent>
                    {STAFF.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Secretary</Label>
                <Select value={secretary} onValueChange={setSecretary}>
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Select secretary" /></SelectTrigger>
                  <SelectContent>
                    {STAFF.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Legal Tracking</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Limitation Date</Label>
                <Input type="date" value={limitationDate} onChange={e => setLimitationDate(e.target.value)} className="mt-1 h-9" />
                {limitationDate && (() => {
                  const d = Math.ceil((new Date(limitationDate).getTime() - Date.now()) / 86400000);
                  if (d < 30) return <p className="text-xs text-destructive mt-1">⚠ {d} days remaining</p>;
                })()}
              </div>
              <div>
                <Label className="text-xs">Mediation Status</Label>
                <Select value={mediationStatus} onValueChange={setMediationStatus}>
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["N/A","Pending","Scheduled","Completed"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Arbitration Status</Label>
                <Select value={arbitrationStatus} onValueChange={setArbitrationStatus}>
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["N/A","Pending","Scheduled","Completed"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">MVA Client Fault</Label>
                <Select value={mvaClientFault} onValueChange={setMvaClientFault}>
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No">No</SelectItem>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="Partial">Partial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Third Party Lawyer</Label>
                <Input value={thirdPartyLawyer} onChange={e => setThirdPartyLawyer(e.target.value)} placeholder="Lawyer name" className="mt-1 h-9" />
              </div>
              <div>
                <Label className="text-xs">Tort File No.</Label>
                <Input value={tortFileNo} onChange={e => setTortFileNo(e.target.value)} placeholder="Tort file number" className="mt-1 h-9" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Benefits</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Switch checked={benefitsClaiming} onCheckedChange={setBenefitsClaiming} />
                <Label className="text-sm">Benefits Claiming</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={irbNonEarnerDue} onCheckedChange={setIrbNonEarnerDue} />
                <Label className="text-sm">IRB / Non-Earner Due</Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between gap-3">
            <Button variant="outline" onClick={() => setStep(1)}>← Back</Button>
            <Button onClick={handleStep2Submit} disabled={saving}>
              {saving ? "Creating Case..." : "Create Case"}
            </Button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}