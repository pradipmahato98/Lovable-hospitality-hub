import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calculator,
  Plus,
  Settings2,
  Layers,
  CheckCircle2,
  Calendar,
  ChevronRight
} from "lucide-react";

interface BudgetSetupServiceProps {
  isReadOnly?: boolean;
}

export function BudgetSetupService({ isReadOnly }: BudgetSetupServiceProps) {
  const templates = [
    { id: '1', name: 'Operational Budget 2026', type: 'Annual', departments: 12, status: 'Active' },
    { id: '2', name: 'Capital Expenditure (CAPEX)', type: 'Project', departments: 4, status: 'Draft' },
    { id: '3', name: 'Marketing Campaign Q1', type: 'Quarterly', departments: 1, status: 'Approved' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" /> Budget Setup & Templates
          </h2>
          <p className="text-muted-foreground text-sm">Define fiscal frameworks, allocation rules, and approval hierarchies.</p>
        </div>
        {!isReadOnly && (
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Create Template
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Budgeting Templates</CardTitle>
            <CardDescription>Master structures for various financial periods</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Depts</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium text-sm">{t.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] uppercase font-bold">{t.type}</Badge>
                    </TableCell>
                    <TableCell className="text-center text-xs">{t.departments}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        t.status === 'Active' ? "bg-success/10 text-success border-success/20" :
                        t.status === 'Approved' ? "bg-primary/10 text-primary border-primary/20" : "bg-muted"
                      }>
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" /> Allocation Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 border rounded-lg bg-secondary/20 text-xs">
                <p className="font-semibold mb-1">Revenue-Based Spreading</p>
                <p className="text-muted-foreground">Distribute costs based on departmental revenue contribution ratios.</p>
              </div>
              <div className="p-3 border rounded-lg bg-secondary/20 text-xs">
                <p className="font-semibold mb-1">Fixed Equal Split</p>
                <p className="text-muted-foreground">Divide shared expenses equally across all 12 operational departments.</p>
              </div>
              <Button variant="outline" size="sm" className="w-full text-xs" disabled={isReadOnly}>
                <Settings2 className="h-3 w-3 mr-2" /> Configure Rules
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/10">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Multi-Level Approval
               </CardTitle>
            </CardHeader>
            <CardContent>
               <p className="text-xs text-muted-foreground leading-relaxed">
                  Budget approvals follow a 3-tier process: Department Head → Financial Controller → General Manager.
               </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
