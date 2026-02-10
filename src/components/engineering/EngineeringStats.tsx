import { Card, CardContent } from "@/components/ui/card";
import { Wrench, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

interface EngineeringStatsProps {
  stats: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  };
}

export const EngineeringStats = ({ stats }: EngineeringStatsProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Requests</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Wrench className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-amber-500">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-amber-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold text-blue-500">{stats.inProgress}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-success">{stats.completed}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
