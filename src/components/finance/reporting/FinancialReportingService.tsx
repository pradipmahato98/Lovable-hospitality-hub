import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinancialStatements } from "../FinancialStatements";
import { ARAgingReport } from "./ARAgingReport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, TrendingUp, Scale, ListChecks, Clock } from "lucide-react";

export function FinancialReportingService({ isReadOnly }: { isReadOnly?: boolean }) {
  const [activeReport, setActiveReport] = useState("statements");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card
          className={`cursor-pointer transition-all hover:border-primary ${activeReport === 'statements' ? 'border-primary bg-primary/5' : ''}`}
          onClick={() => setActiveReport('statements')}
        >
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Financial Statements</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">P&L and Balance Sheet</p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:border-primary ${activeReport === 'aging' ? 'border-primary bg-primary/5' : ''}`}
          onClick={() => setActiveReport('aging')}
        >
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AR Aging</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Outstanding receivables</p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:border-primary ${activeReport === 'trial-balance' ? 'border-primary bg-primary/5' : ''}`}
          onClick={() => setActiveReport('trial-balance')}
        >
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trial Balance</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Account balances summary</p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:border-primary ${activeReport === 'audit' ? 'border-primary bg-primary/5' : ''}`}
          onClick={() => setActiveReport('audit')}
        >
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audit Reports</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Night audit logs & history</p>
          </CardContent>
        </Card>
      </div>

      {activeReport === 'statements' && <FinancialStatements isReadOnly={isReadOnly} />}
      {activeReport === 'aging' && <ARAgingReport />}
      {activeReport === 'trial-balance' && (
        <Card>
          <CardHeader>
            <CardTitle>Trial Balance Report</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Trial balance generated from the FinancialReportService.</p>
            {/* Implementation would use FinancialReportService.generateTrialBalance */}
          </CardContent>
        </Card>
      )}
      {activeReport === 'audit' && (
        <Card>
          <CardHeader>
            <CardTitle>Night Audit History</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Viewing history from night_audit_runs table.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
