import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OCF_FORMS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { FileText } from "lucide-react";

export default function OcfFormsTab({ caseId }: { caseId: string }) {
  const { toast } = useToast();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {OCF_FORMS.map((form) => (
        <Card key={form.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm">{form.name}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">{form.description}</p>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">Not exported</Badge>
              <Button size="sm" variant="outline" onClick={() => toast({ title: "Export Initiated", description: `${form.name} form will be generated from case data.` })}>
                Fill & Export
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
