import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, FileCheck, ClipboardList, Plus } from "lucide-react";
import TemplateFillModal from "@/components/templates/TemplateFillModal";

const SYSTEM_TEMPLATES = [
  { id: "ocf-6", name: "OCF-6 Expenses Claim Form", icon: DollarSign, description: "Claim expenses not submitted by health care provider", fieldsCount: 12 },
  { id: "ocf-10", name: "OCF-10 Election of Benefits", icon: FileCheck, description: "Election of Income Replacement, Non-Earner or Caregiver Benefit", fieldsCount: 8 },
  { id: "matrix-intake", name: "Matrix Intake Form", icon: ClipboardList, description: "Initial client interview and intake data collection form", fieldsCount: 45 },
];

export default function Templates() {
  const navigate = useNavigate();
  const [fillModal, setFillModal] = useState<{ open: boolean; templateId: string; templateName: string }>({ open: false, templateId: "", templateName: "" });

  const openFill = (id: string, name: string) => setFillModal({ open: true, templateId: id, templateName: name });

  return (
    <AppLayout title="Templates">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">System Templates</h2>
        <Button size="sm" onClick={() => navigate("/templates/editor")}>
          <Plus className="h-4 w-4 mr-1" /> Create New Template
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SYSTEM_TEMPLATES.map((t) => (
          <Card key={t.id} className="flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <t.icon className="h-5 w-5 text-primary" />
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">System Template</Badge>
              </div>
              <CardTitle className="text-sm mt-2">{t.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <p className="text-xs text-muted-foreground mb-3">{t.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t.fieldsCount} fillable fields</span>
                <Button size="sm" onClick={() => openFill(t.id, t.name)}>Fill & Export</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {fillModal.open && (
        <TemplateFillModal
          templateId={fillModal.templateId}
          templateName={fillModal.templateName}
          onClose={() => setFillModal({ open: false, templateId: "", templateName: "" })}
        />
      )}
    </AppLayout>
  );
}
