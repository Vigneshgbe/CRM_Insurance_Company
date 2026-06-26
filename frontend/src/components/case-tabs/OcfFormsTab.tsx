import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OCF_FORMS, API_BASE_URL } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { FileText, CheckCircle, Clock } from "lucide-react";
import { formatDate } from "@/lib/formatters";

function getToken() {
  return localStorage.getItem("crm_token") || localStorage.getItem("token") || "";
}

// Shape returned by GET /api/cases/:caseId/ocf/:formNumber
interface OcfRecord {
  formNumber: string;
  exportedAt: string | null;
  exportCount: number;
  lastExportedBy: string | null;
}

export default function OcfFormsTab({ caseId }: { caseId: string }) {
  const { toast } = useToast();
  // Map of formNumber → OcfRecord (null = never saved)
  const [records, setRecords] = useState<Record<string, OcfRecord | null>>({});
  const [loadingForm, setLoadingForm] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);

  // ── Load status for all OCF forms in parallel ────────────────────────────
  useEffect(() => {
    const headers = { Authorization: `Bearer ${getToken()}` };

    Promise.all(
      OCF_FORMS.map((form) =>
        fetch(`${API_BASE_URL}/cases/${caseId}/ocf/${form.id}`, { headers })
          .then((r) => r.ok ? r.json() : null)
          .then((data) => ({ id: form.id, data }))
          .catch(() => ({ id: form.id, data: null }))
      )
    )
      .then((results) => {
        const map: Record<string, OcfRecord | null> = {};
        results.forEach(({ id, data }) => {
          map[id] = data && data.formNumber ? data : null;
        });
        setRecords(map);
      })
      .finally(() => setFetching(false));
  }, [caseId]);

  // ── Fill & Export: save record to DB then show toast ────────────────────
  const handleExport = async (formId: string, formName: string) => {
    setLoadingForm(formId);
    try {
      const res = await fetch(`${API_BASE_URL}/cases/${caseId}/ocf/${formId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          formNumber: formId,
          exportedAt: new Date().toISOString(),
        }),
      });

      if (!res.ok) throw new Error();
      const saved = await res.json();

      // Update local state
      setRecords((prev) => ({ ...prev, [formId]: saved }));
      toast({
        title: "Export Initiated",
        description: `${formName} form will be generated from case data.`,
      });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setLoadingForm(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Status summary */}
      {!fetching && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5 text-success" />
            {Object.values(records).filter(Boolean).length} exported
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            {Object.values(records).filter((r) => !r).length} pending
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {OCF_FORMS.map((form) => {
          const record = records[form.id];
          const isExported = !!record;
          const isLoading = loadingForm === form.id;

          return (
            <Card key={form.id} className={isExported ? "border-success/40 bg-success/5" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <FileText className={`h-5 w-5 ${isExported ? "text-success" : "text-primary"}`} />
                  <CardTitle className="text-sm">{form.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">{form.description}</p>

                {/* Export history */}
                {isExported && record && (
                  <div className="text-xs text-muted-foreground mb-2 space-y-0.5">
                    {record.exportedAt && (
                      <p>Last exported: {formatDate(record.exportedAt.split("T")[0])}</p>
                    )}
                    {record.exportCount > 1 && (
                      <p>Exported {record.exportCount}× total</p>
                    )}
                    {record.lastExportedBy && (
                      <p>By: {record.lastExportedBy}</p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Badge
                    variant={isExported ? "default" : "outline"}
                    className={`text-xs ${isExported ? "bg-success/20 text-success border-success/30 hover:bg-success/20" : ""}`}
                  >
                    {fetching ? "Loading..." : isExported ? "Exported" : "Not exported"}
                  </Badge>
                  <Button
                    size="sm"
                    variant={isExported ? "outline" : "default"}
                    disabled={isLoading || fetching}
                    onClick={() => handleExport(form.id, form.name)}
                  >
                    {isLoading ? "Saving..." : isExported ? "Re-export" : "Fill & Export"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
