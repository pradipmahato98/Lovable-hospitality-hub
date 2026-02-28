import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText } from "lucide-react";

export const StaffRecordsTab = () => {
  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Staff Records
        </CardTitle>
        <CardDescription>Comprehensive employee documentation and records</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Staff Records Coming Soon</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            This module will provide a centralized repository for all employee-related documents, contracts, and certification records.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
