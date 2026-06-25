import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DollarSign, FileCheck, ClipboardList, Plus, Search,
  FileText, Shield, Stethoscope, HeartPulse, Wallet,
  FileSignature, UserCheck, Ambulance, BadgeHelp, FilePlus
} from "lucide-react";
import TemplateFillModal from "@/components/templates/TemplateFillModal";

// All OCF forms from uploaded government PDFs + system templates
const SYSTEM_TEMPLATES = [
  {
    id: "ocf-1",
    name: "OCF-1 — Application for Accident Benefits",
    icon: FileText,
    description: "Initial application for accident benefits from your auto insurer.",
    category: "OCF Government Form",
    fieldsCount: 20,
  },
  {
    id: "ocf-2",
    name: "OCF-2 — Employer's Confirmation Form",
    icon: UserCheck,
    description: "Employer confirms employment details and income for IRB calculation.",
    category: "OCF Government Form",
    fieldsCount: 14,
  },
  {
    id: "ocf-3",
    name: "OCF-3 — Disability Certificate",
    icon: Stethoscope,
    description: "Healthcare provider confirms client's disability from accident injuries.",
    category: "OCF Government Form",
    fieldsCount: 18,
  },
  {
    id: "ocf-4",
    name: "OCF-4 — Death and Funeral Benefits Application",
    icon: FileSignature,
    description: "Application for death and funeral benefits for an insured person.",
    category: "OCF Government Form",
    fieldsCount: 12,
  },
  {
    id: "ocf-5",
    name: "OCF-5 — Permission to Disclose Health Information",
    icon: Shield,
    description: "Client authorization to disclose health information to insurer.",
    category: "OCF Government Form",
    fieldsCount: 10,
  },
  {
    id: "ocf-6",
    name: "OCF-6 — Expenses Claim Form",
    icon: DollarSign,
    description: "Claim expenses not submitted by a health care provider.",
    category: "OCF Government Form",
    fieldsCount: 15,
  },
  {
    id: "ocf-10",
    name: "OCF-10 — Election of Benefits",
    icon: FileCheck,
    description: "Election of Income Replacement, Non-Earner or Caregiver Benefit.",
    category: "OCF Government Form",
    fieldsCount: 8,
  },
  {
    id: "ocf-18",
    name: "OCF-18 — Treatment and Assessment Plan",
    icon: HeartPulse,
    description: "Healthcare provider submits proposed treatment and assessment plan.",
    category: "OCF Government Form",
    fieldsCount: 22,
  },
  {
    id: "ocf-19",
    name: "OCF-19 — Application for Determination of Catastrophic Impairment",
    icon: Ambulance,
    description: "Application to determine if injuries qualify as catastrophic impairment.",
    category: "OCF Government Form",
    fieldsCount: 16,
  },
  {
    id: "ocf-23",
    name: "OCF-23 — Treatment Confirmation Form",
    icon: BadgeHelp,
    description: "Confirms treatment provided to the insured person.",
    category: "OCF Government Form",
    fieldsCount: 10,
  },
  {
    id: "matrix-intake",
    name: "Matrix Legal Intake Form",
    icon: ClipboardList,
    description: "Complete initial client interview and intake data collection form.",
    category: "Internal Template",
    fieldsCount: 45,
  },
];

const CATEGORIES = ["All", "OCF Government Form", "Internal Template"];

const CATEGORY_COLORS: Record<string, string> = {
  "OCF Government Form": "bg-blue-100 text-blue-800",
  "Internal Template": "bg-purple-100 text-purple-800",
};

export default function Templates() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [fillModal, setFillModal] = useState<{ open: boolean; templateId: string; templateName: string }>({
    open: false, templateId: "", templateName: "",
  });

  const filtered = SYSTEM_TEMPLATES.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "All" || t.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <AppLayout title="Templates">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold">OCF Forms & Templates</h2>
          <p className="text-sm text-muted-foreground">Government OCF forms and internal templates — fill with case data and export</p>
        </div>
        <Button size="sm" onClick={() => navigate("/templates/editor")}>
          <Plus className="h-4 w-4 mr-1" />Create Custom Template
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search forms..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 w-56 h-9 text-sm"
          />
        </div>
        <div className="flex gap-1">
          {CATEGORIES.map(c => (
            <Button
              key={c}
              size="sm"
              variant={categoryFilter === c ? "default" : "outline"}
              onClick={() => setCategoryFilter(c)}
              className="h-9 text-xs"
            >
              {c}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(t => (
          <Card key={t.id} className="flex flex-col hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <t.icon className="h-5 w-5 text-primary" />
                </div>
                <Badge className={`text-xs ${CATEGORY_COLORS[t.category] || "bg-gray-100 text-gray-700"}`}>
                  {t.category}
                </Badge>
              </div>
              <CardTitle className="text-sm mt-2 leading-snug">{t.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <p className="text-xs text-muted-foreground mb-4">{t.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t.fieldsCount} fillable fields</span>
                <Button
                  size="sm"
                  onClick={() => setFillModal({ open: true, templateId: t.id, templateName: t.name })}
                >
                  Fill &amp; Export
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-12 text-muted-foreground text-sm">
            <FilePlus className="h-8 w-8 mx-auto mb-2 opacity-30" />
            No templates match your search.
          </div>
        )}
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
