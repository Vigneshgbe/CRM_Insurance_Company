import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const OCF_FORMS = [
  { id: "OCF-1", name: "OCF-1 — Application for Accident Benefits" },
  { id: "OCF-2", name: "OCF-2 — Employer's Confirmation" },
  { id: "OCF-3", name: "OCF-3 — Disability Certificate" },
  { id: "OCF-5", name: "OCF-5 — Permission to Disclose Health Information" },
  { id: "OCF-6", name: "OCF-6 — Expenses Claim Form" },
  { id: "OCF-10", name: "OCF-10 — Election of Benefits" },
  { id: "OCF-18", name: "OCF-18 — Treatment and Assessment Plan" },
  { id: "OCF-23", name: "OCF-23 — Treatment Confirmation Form" },
];

export default function OcfFormsTab({ caseId }: { caseId: string }) {
  const { toast } = useToast();

  function handleGenerate(formId: string) {
    toast({ title: `${formId} — Coming Soon`, description: "PDF generation will be available shortly." });
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {OCF_FORMS.map((form) => (
          <Card key={form.id}>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{form.name}</CardTitle></CardHeader>
            <CardContent>
              <Button size="sm" variant="outline" onClick={() => handleGenerate(form.id)}>
                Fill &amp; Export
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
