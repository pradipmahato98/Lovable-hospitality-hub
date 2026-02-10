import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Clock, Sparkles } from "lucide-react";

interface HousekeepingStatsProps {
  stats: {
    clean: number;
    dirty: number;
    inProgress: number;
    inspected: number;
  };
  onFilterStatus: (status: string) => void;
}

export const HousekeepingStats = ({ stats, onFilterStatus }: HousekeepingStatsProps) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="cursor-pointer hover:border-success/50" onClick={() => onFilterStatus("clean")}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Clean</p>
              <p className="text-2xl font-bold text-success">{stats.clean}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
        </CardContent>
      </Card>
      <Card className="cursor-pointer hover:border-destructive/50" onClick={() => onFilterStatus("dirty")}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Dirty</p>
              <p className="text-2xl font-bold text-destructive">{stats.dirty}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
        </CardContent>
      </Card>
      <Card className="cursor-pointer hover:border-amber-500/50" onClick={() => onFilterStatus("in_progress")}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold text-amber-400">{stats.inProgress}</p>
            </div>
            <Clock className="h-8 w-8 text-amber-400" />
          </div>
        </CardContent>
      </Card>
      <Card className="cursor-pointer hover:border-blue-500/50" onClick={() => onFilterStatus("inspected")}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Inspected</p>
              <p className="text-2xl font-bold text-blue-400">{stats.inspected}</p>
            </div>
            <Sparkles className="h-8 w-8 text-blue-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
