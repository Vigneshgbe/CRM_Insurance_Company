import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PROVINCES, MARITAL_STATUSES } from "@/lib/constants";
import { API_BASE_URL } from "@/lib/constants";


// ── Token helper — matches auth.tsx which stores as crm_token ──────────────
function getToken() {
  return localStorage.getItem("crm_token") || localStorage.getItem("token") || "";
}

type YN = "Yes" | "No" | "";

function YesNo({ value, onChange }: { value: YN; onChange: (v: YN) => void }) {
  return (
    <div className="flex items-center gap-3">
      <label className="flex items-center gap-1.5 text-xs">
        <Checkbox checked={value === "Yes"} onCheckedChange={(c) => onChange(c ? "Yes" : "")} />
        Yes
      </label>
      <label className="flex items-center gap-1.5 text-xs">
        <Checkbox checked={value === "No"} onCheckedChange={(c) => onChange(c ? "No" : "")} />
        No
      </label>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

// ── Default form shape — all fields from both DB and UI ───────────────────
const defaultForm = {
  // Header fields — pre-filled from case data, also saved to interview table
  fileNo: "",
  dateOfLoss: "",          // maps to date_of_mva in DB
  limitationDate: "",      // stored on case record, not interview table
  interviewedBy: "",
  interviewedOn: "",
  referredBy: "",
  conflictChecked: "Yes" as YN,
  conflictFind: "No" as YN,   // maps to any_conflict in DB
  fault: "Third Party",        // maps to client_role in DB (closest field)
  fileStatus: "Active",        // from case record
  abCounsel: "",               // maps to interviewed_by (reused)
  secretary: "",
  tortLawFirm: "",
  tortCounsel: "",
  // Personal data — from client record on case
  salutation: "Mr.",
  gender: "Male",
  dob: "",
  firstName: "",
  lastName: "",
  unitNumber: "",
  streetNumber: "",
  streetName: "",
  city: "",
  province: "Ontario",
  postalCode: "",
  country: "Canada",
  homePhone: "",
  mobile: "",
  otherPhone: "",
  whatsapp: "",
  email: "",
  maritalStatus: "Married",
  dependants: "0",
  bornInCanada: "Yes",
  bornWhere: "",
  yearImmigrated: "",
  languages: "English",
  speaksEnglish: "Yes" as YN,
  interpreter: "No" as YN,
  languageNeeds: "",
  electronicConsent: "Yes" as YN,
  benefitChosen: "Income Replacement Benefit",
  // ID Documents
  driverLicense: "",
  driverLicenseCopy: "No" as YN,
  healthCard: "",
  healthCardCopy: "No" as YN,
  sin: "",
  sinCopy: "No" as YN,
  ontarioId: false,
  ontarioIdNo: "",
  ontarioIdCopy: "No" as YN,
  prCard: false,
  prCardNo: "",
  prCardCopy: "No" as YN,
  citizenCard: false,
  citizenCardNo: "",
  citizenCardCopy: "No" as YN,
};

export default function InitialInterviewTab({ caseId }: { caseId: string }) {
  const { toast } = useToast();
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isTort, setIsTort] = useState(false);
  const [form, setForm] = useState({ ...defaultForm });

  // ── Load: fetch case + interview data in parallel ──────────────────────
  useEffect(() => {
    if (!caseId) return;

    const headers = { Authorization: `Bearer ${getToken()}` };

    Promise.all([
      fetch(`${API_BASE_URL}/cases/${caseId}`, { headers }).then(r => r.ok ? r.json() : null),
      fetch(`${API_BASE_URL}/cases/${caseId}/initial-interview`, { headers }).then(r => r.ok ? r.json() : null),
    ])
      .then(([caseData, interview]) => {
        // Determine TORT vs AB
        if (caseData?.tortFileNo && !caseData?.benefitsClaiming) {
          setIsTort(true);
        }

        // Build merged form: interview DB data takes priority, case data fills blanks
        setForm({
          // Header — prefer interview DB, fall back to case record
          fileNo:           interview?.fileNo          || caseData?.fileNo          || "",
          dateOfLoss:       interview?.dateOfMVA       || (caseData?.dateOfLoss     ? caseData.dateOfLoss.split("T")[0]     : ""),
          limitationDate:   caseData?.limitationDate   ? caseData.limitationDate.split("T")[0] : "",
          interviewedBy:    interview?.interviewedBy   || caseData?.clerkAssigned   || "",
          interviewedOn:    interview?.interviewedOn   || (caseData?.openDate       ? caseData.openDate.split("T")[0]       : ""),
          referredBy:       interview?.referredBy      || caseData?.referredBy      || "",
          conflictChecked:  (interview?.conflictChecked || "Yes") as YN,
          conflictFind:     (interview?.anyConflict     || "No")  as YN,
          fault:            interview?.clientRole      || "Third Party",
          fileStatus:       caseData?.fileStatus       || "Active",
          abCounsel:        interview?.interviewedBy   || "",
          secretary:        caseData?.secretary        || "",
          tortLawFirm:      "",
          tortCounsel:      caseData?.thirdPartyLawyer || "",
          // Personal — from client record on the case
          salutation:       "Mr.",
          gender:           "Male",
          dob:              caseData?.client?.dateOfBirth ? caseData.client.dateOfBirth.split("T")[0] : "",
          firstName:        caseData?.client?.firstName   || "",
          lastName:         caseData?.client?.lastName    || "",
          unitNumber:       "",
          streetNumber:     "",
          streetName:       caseData?.clientStreet        || "",
          city:             caseData?.clientCity          || "",
          province:         caseData?.clientState         || "Ontario",
          postalCode:       caseData?.clientZip           || "",
          country:          caseData?.clientCountry       || "Canada",
          homePhone:        caseData?.client?.homePhone   || "",
          mobile:           caseData?.clientMobile        || "",
          otherPhone:       caseData?.client?.workPhone   || "",
          whatsapp:         "",
          email:            caseData?.client?.email       || "",
          maritalStatus:    caseData?.client?.maritalStatus || "Married",
          dependants:       String(caseData?.client?.dependants ?? "0"),
          bornInCanada:     (interview?.bornInCanada       || "Yes"),
          bornWhere:        interview?.whereBorn           || "",
          yearImmigrated:   interview?.yearImmigrated      || "",
          languages:        interview?.language            || "English",
          speaksEnglish:    (interview?.speaksEnglish      || "Yes") as YN,
          interpreter:      (interview?.interpreterRequired || "No") as YN,
          languageNeeds:    "",
          electronicConsent: "Yes" as YN,
          benefitChosen:    "Income Replacement Benefit",
          // ID Docs — from case_client_id_docs via interview if available
          driverLicense:    "",
          driverLicenseCopy: "No" as YN,
          healthCard:       "",
          healthCardCopy:   "No" as YN,
          sin:              "",
          sinCopy:          "No" as YN,
          ontarioId:        false,
          ontarioIdNo:      "",
          ontarioIdCopy:    "No" as YN,
          prCard:           false,
          prCardNo:         "",
          prCardCopy:       "No" as YN,
          citizenCard:      false,
          citizenCardNo:    "",
          citizenCardCopy:  "No" as YN,
        });
      })
      .catch(() => toast({ title: "Error loading interview data", variant: "destructive" }))
      .finally(() => setFetching(false));
  }, [caseId]);

  const age = useMemo(() => {
    if (!form.dob) return "";
    const d = new Date(form.dob);
    const diff = Date.now() - d.getTime();
    return String(Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000)));
  }, [form.dob]);

  const upd = (k: keyof typeof form, v: any) => setForm((p) => ({ ...p, [k]: v }));

  // ── Save: POST to /api/cases/:caseId/initial-interview ────────────────
  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        // ── Original interview fields ──────────────────────────────────────
        conflictChecked:        form.conflictChecked,
        anyConflict:            form.conflictFind,
        fileNo:                 form.fileNo,
        dateOfMVA:              form.dateOfLoss       || null,
        interviewedBy:          form.interviewedBy,
        interviewedOn:          form.interviewedOn    || null,
        referredBy:             form.referredBy,
        speaksEnglish:          form.speaksEnglish,
        interpreterRequired:    form.interpreter,
        language:               form.languages,
        bornInCanada:           form.bornInCanada,
        whereBorn:              form.bornWhere,
        yearImmigrated:         form.yearImmigrated,
        clientRole:             form.fault,
        seatBelted:             "Yes",
        accidentAtWork:         "No",
        wsibFiled:              "No",
        streetName:             form.streetName,
        majorIntersection:      "",
        city:                   form.city,
        province:               form.province,
        timeOfMVA:              "",
        policeReported:         "No",
        dateReported:           null,
        policeCameToScene:      "No",
        policeDepartment:       "",
        incidentNo:             "",
        officerName:            "",
        badgeNo:                "",
        clientCharged:          "No",
        clientChargedDesc:      "",
        thirdPartyCharged:      "No",
        thirdPartyChargedDesc:  "",
        numOccupants:           "",
        seatingArrangement:     "",
        photosOfDamage:         "No",
        estimatedDamage:        "",
        accidentDescription:    "",
        // ── Personal / header fields (previously missing from save) ───────
        salutation:             form.salutation,
        gender:                 form.gender,
        unitNumber:             form.unitNumber,
        streetNumber:           form.streetNumber,
        postalCode:             form.postalCode,
        country:                form.country,
        homePhone:              form.homePhone,
        mobile:                 form.mobile,
        otherPhone:             form.otherPhone,
        whatsapp:               form.whatsapp,
        email:                  form.email,
        maritalStatus:          form.maritalStatus,
        dependants:             form.dependants,
        languageNeeds:          form.languageNeeds,
        electronicConsent:      form.electronicConsent,
        benefitChosen:          form.benefitChosen,
        tortLawFirm:            form.tortLawFirm,
        tortCounsel:            form.tortCounsel,
        abCounsel:              form.abCounsel,
        secretary:              form.secretary,
        fileStatus:             form.fileStatus,
        // ── ID Documents (previously never saved) ─────────────────────────
        driverLicense:          form.driverLicense,
        driverLicenseCopy:      form.driverLicenseCopy,
        healthCard:             form.healthCard,
        healthCardCopy:         form.healthCardCopy,
        sin:                    form.sin,
        sinCopy:                form.sinCopy,
        ontarioId:              form.ontarioId,
        ontarioIdNo:            form.ontarioIdNo,
        ontarioIdCopy:          form.ontarioIdCopy,
        prCard:                 form.prCard,
        prCardNo:               form.prCardNo,
        prCardCopy:             form.prCardCopy,
        citizenCard:            form.citizenCard,
        citizenCardNo:          form.citizenCardNo,
        citizenCardCopy:        form.citizenCardCopy,
      };

      const res = await fetch(`${API_BASE_URL}/cases/${caseId}/initial-interview`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();
      toast({ title: "Initial Interview saved" });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (fetching) {
    return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Interview Header */}
      <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{isTort ? "TORT" : "AB"} — Interview Header</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Field label="File No."><Input className="h-9 text-sm" value={form.fileNo} onChange={(e) => upd("fileNo", e.target.value)} /></Field>
                  <Field label="Date of Loss"><Input type="date" className="h-9 text-sm" value={form.dateOfLoss} onChange={(e) => upd("dateOfLoss", e.target.value)} /></Field>
                  <Field label="Date of Limitation"><Input type="date" className="h-9 text-sm" value={form.limitationDate} onChange={(e) => upd("limitationDate", e.target.value)} /></Field>
                  <Field label="Interviewed By"><Input className="h-9 text-sm" value={form.interviewedBy} onChange={(e) => upd("interviewedBy", e.target.value)} /></Field>
                  <Field label="Interviewed On"><Input type="date" className="h-9 text-sm" value={form.interviewedOn} onChange={(e) => upd("interviewedOn", e.target.value)} /></Field>
                  <Field label="Referred By"><Input className="h-9 text-sm" value={form.referredBy} onChange={(e) => upd("referredBy", e.target.value)} /></Field>
                  <Field label="Conflict Checked?"><YesNo value={form.conflictChecked} onChange={(v) => upd("conflictChecked", v)} /></Field>
                  <Field label="Conflict Find?"><YesNo value={form.conflictFind} onChange={(v) => upd("conflictFind", v)} /></Field>
                  <Field label="Whose fault is the accident?"><Input className="h-9 text-sm" value={form.fault} onChange={(e) => upd("fault", e.target.value)} /></Field>
                  <Field label="File Status"><Input className="h-9 text-sm" value={form.fileStatus} onChange={(e) => upd("fileStatus", e.target.value)} /></Field>
                  <Field label="AB Counsel"><Input className="h-9 text-sm" value={form.abCounsel} onChange={(e) => upd("abCounsel", e.target.value)} /></Field>
                  <Field label="Secretary"><Input className="h-9 text-sm" value={form.secretary} onChange={(e) => upd("secretary", e.target.value)} /></Field>
                  <Field label="Tort Law Firm"><Input className="h-9 text-sm" value={form.tortLawFirm} onChange={(e) => upd("tortLawFirm", e.target.value)} /></Field>
                  <Field label="Tort Counsel"><Input className="h-9 text-sm" value={form.tortCounsel} onChange={(e) => upd("tortCounsel", e.target.value)} /></Field>
                </div>
              </CardContent>
            </Card>

            {/* Personal Data */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Personal Data</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Field label="Salutation"><Input className="h-9 text-sm" value={form.salutation} onChange={(e) => upd("salutation", e.target.value)} /></Field>
                  <Field label="Gender"><Input className="h-9 text-sm" value={form.gender} onChange={(e) => upd("gender", e.target.value)} /></Field>
                  <Field label="Date of Birth"><Input type="date" className="h-9 text-sm" value={form.dob} onChange={(e) => upd("dob", e.target.value)} /></Field>
                  <Field label="Age"><Input readOnly className="h-9 text-sm bg-muted" value={age} /></Field>
                  <Field label="First Name"><Input className="h-9 text-sm" value={form.firstName} onChange={(e) => upd("firstName", e.target.value)} /></Field>
                  <Field label="Last Name"><Input className="h-9 text-sm" value={form.lastName} onChange={(e) => upd("lastName", e.target.value)} /></Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Field label="Unit Number"><Input className="h-9 text-sm" value={form.unitNumber} onChange={(e) => upd("unitNumber", e.target.value)} /></Field>
                  <Field label="Street Number"><Input className="h-9 text-sm" value={form.streetNumber} onChange={(e) => upd("streetNumber", e.target.value)} /></Field>
                  <Field label="Street Name"><Input className="h-9 text-sm" value={form.streetName} onChange={(e) => upd("streetName", e.target.value)} /></Field>
                  <Field label="City"><Input className="h-9 text-sm" value={form.city} onChange={(e) => upd("city", e.target.value)} /></Field>
                  <Field label="Province">
                    <Select value={form.province} onValueChange={(v) => upd("province", v)}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>{PROVINCES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Postal Code"><Input className="h-9 text-sm" value={form.postalCode} onChange={(e) => upd("postalCode", e.target.value)} /></Field>
                  <Field label="Country"><Input className="h-9 text-sm" value={form.country} onChange={(e) => upd("country", e.target.value)} /></Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Field label="Home Phone"><Input className="h-9 text-sm" value={form.homePhone} onChange={(e) => upd("homePhone", e.target.value)} /></Field>
                  <Field label="Mobile"><Input className="h-9 text-sm" value={form.mobile} onChange={(e) => upd("mobile", e.target.value)} /></Field>
                  <Field label="Any Other Phone"><Input className="h-9 text-sm" value={form.otherPhone} onChange={(e) => upd("otherPhone", e.target.value)} /></Field>
                  <Field label="WhatsApp"><Input className="h-9 text-sm" value={form.whatsapp} onChange={(e) => upd("whatsapp", e.target.value)} /></Field>
                  <Field label="Email"><Input type="email" className="h-9 text-sm" value={form.email} onChange={(e) => upd("email", e.target.value)} /></Field>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Marital Status</Label>
                  <RadioGroup value={form.maritalStatus} onValueChange={(v) => upd("maritalStatus", v)} className="flex flex-wrap gap-4 mt-2">
                    {[...MARITAL_STATUSES, "Widow(er)"].filter((v, i, a) => a.indexOf(v) === i).map((m) => (
                      <label key={m} className="flex items-center gap-1.5 text-xs">
                        <RadioGroupItem value={m} id={`ms-${m}`} />
                        <span>{m}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Field label="Number of Dependants"><Input type="number" className="h-9 text-sm" value={form.dependants} onChange={(e) => upd("dependants", e.target.value)} /></Field>
                  <Field label="Was client born in Canada?"><Input className="h-9 text-sm" value={form.bornInCanada} onChange={(e) => upd("bornInCanada", e.target.value as any)} /></Field>
                  <Field label="Where?"><Input className="h-9 text-sm" value={form.bornWhere} onChange={(e) => upd("bornWhere", e.target.value)} /></Field>
                  <Field label="Year immigrated to Canada?"><Input className="h-9 text-sm" value={form.yearImmigrated} onChange={(e) => upd("yearImmigrated", e.target.value)} /></Field>
                  <Field label="Languages Used"><Input className="h-9 text-sm" value={form.languages} onChange={(e) => upd("languages", e.target.value)} /></Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Field label="Does the client speak English?"><YesNo value={form.speaksEnglish} onChange={(v) => upd("speaksEnglish", v)} /></Field>
                  <Field label="Does the client require an interpreter?"><YesNo value={form.interpreter} onChange={(v) => upd("interpreter", v)} /></Field>
                  <Field label="Language needs?"><Input className="h-9 text-sm" value={form.languageNeeds} onChange={(e) => upd("languageNeeds", e.target.value)} /></Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Consent to electronic communication if offered by insurer?"><YesNo value={form.electronicConsent} onChange={(v) => upd("electronicConsent", v)} /></Field>
                  <Field label="Client chooses to receive the following benefit"><Input className="h-9 text-sm" value={form.benefitChosen} onChange={(e) => upd("benefitChosen", e.target.value)} /></Field>
                </div>
              </CardContent>
            </Card>

            {/* ID Documents */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">ID Documents</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { label: "Driver's License No.", numKey: "driverLicense", copyKey: "driverLicenseCopy" },
                    { label: "Health Card No.", numKey: "healthCard", copyKey: "healthCardCopy" },
                    { label: "Social Insurance No.", numKey: "sin", copyKey: "sinCopy" },
                  ].map((r) => (
                    <div key={r.numKey} className="grid grid-cols-12 gap-3 items-center">
                      <Label className="col-span-4 text-xs">{r.label}</Label>
                      <Input className="col-span-5 h-9 text-sm" value={(form as any)[r.numKey]} onChange={(e) => upd(r.numKey as any, e.target.value)} />
                      <div className="col-span-3 flex items-center gap-3">
                        <Label className="text-xs">Copy?</Label>
                        <YesNo value={(form as any)[r.copyKey]} onChange={(v) => upd(r.copyKey as any, v)} />
                      </div>
                    </div>
                  ))}
                  {[
                    { label: "Ontario ID Card", chkKey: "ontarioId", numKey: "ontarioIdNo", copyKey: "ontarioIdCopy" },
                    { label: "PR Card", chkKey: "prCard", numKey: "prCardNo", copyKey: "prCardCopy" },
                    { label: "Citizen Card", chkKey: "citizenCard", numKey: "citizenCardNo", copyKey: "citizenCardCopy" },
                  ].map((r) => (
                    <div key={r.numKey} className="grid grid-cols-12 gap-3 items-center">
                      <label className="col-span-4 flex items-center gap-2 text-xs">
                        <Checkbox checked={(form as any)[r.chkKey]} onCheckedChange={(c) => upd(r.chkKey as any, !!c)} />
                        {r.label}
                      </label>
                      <Input className="col-span-5 h-9 text-sm" placeholder="No." value={(form as any)[r.numKey]} onChange={(e) => upd(r.numKey as any, e.target.value)} />
                      <div className="col-span-3 flex items-center gap-3">
                        <Label className="text-xs">Copy?</Label>
                        <YesNo value={(form as any)[r.copyKey]} onChange={(v) => upd(r.copyKey as any, v)} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={save}
                disabled={saving}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {saving ? "Saving..." : "Save Initial Interview"}
              </Button>
            </div>
    </div>
  );
}