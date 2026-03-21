import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRooms } from "@/hooks/useRooms";
import { useHousekeepingTasks } from "@/hooks/useHousekeeping";
import { Bed, CheckCircle2, Clock, AlertCircle, Sparkles, Loader2, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function AttendantMode() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];
  const { data: rooms, isLoading: roomsLoading } = useRooms();
  const { data: tasks, updateTaskStatus, isLoading: tasksLoading } = useHousekeepingTasks({ date: today });
  const [filter, setFilter] = useState<"all" | "pending" | "in_progress" | "completed">("all");

  const attendantTasks = tasks?.filter(t => {
    // In a real app, we would filter by the logged-in staff ID
    // For demo purposes, we'll show all tasks or tasks assigned to a "demo" user
    if (filter === "all") return true;
    return t.status === filter;
  });

  const handleStatusUpdate = async (taskId: string, currentStatus: string, roomId: string) => {
    let nextStatus = "";
    if (currentStatus === "pending") nextStatus = "in_progress";
    else if (currentStatus === "in_progress") nextStatus = "completed";
    else return;

    try {
      await updateTaskStatus.mutateAsync({ id: taskId, status: nextStatus });

      // If completed, also update the room status to 'available' if it was 'cleaning'
      if (nextStatus === "completed") {
        await supabase.from("rooms").update({ status: "available" }).eq("id", roomId);
      } else if (nextStatus === "in_progress") {
        await supabase.from("rooms").update({ status: "cleaning" }).eq("id", roomId);
      }

      toast.success(`Status updated to ${nextStatus.replace("_", " ")}`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (roomsLoading || tasksLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-slate-500 font-medium">Loading your schedule...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="p-0 h-8 w-8">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-bold">Attendant Mode</h1>
          <div className="w-8"></div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
            className="rounded-full text-xs px-4"
          >
            All ({tasks?.length || 0})
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("pending")}
            className="rounded-full text-xs px-4"
          >
            To Do ({tasks?.filter(t => t.status === "pending").length || 0})
          </Button>
          <Button
            variant={filter === "in_progress" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("in_progress")}
            className="rounded-full text-xs px-4 border-amber-200 text-amber-700 bg-amber-50"
          >
            In Progress ({tasks?.filter(t => t.status === "in_progress").length || 0})
          </Button>
          <Button
            variant={filter === "completed" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("completed")}
            className="rounded-full text-xs px-4 border-emerald-200 text-emerald-700 bg-emerald-50"
          >
            Done ({tasks?.filter(t => t.status === "completed").length || 0})
          </Button>
        </div>
      </header>

      {/* Task List */}
      <main className="flex-1 p-4 space-y-4">
        {attendantTasks?.length === 0 ? (
          <div className="text-center py-20">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4 opacity-20" />
            <p className="text-slate-500 font-medium">No tasks found in this category.</p>
          </div>
        ) : (
          attendantTasks?.map((task) => (
            <Card key={task.id} className="overflow-hidden border-none shadow-sm ring-1 ring-slate-200">
              <CardContent className="p-0">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${
                      task.status === "completed" ? "bg-emerald-100 text-emerald-600" :
                      task.status === "in_progress" ? "bg-amber-100 text-amber-600" :
                      "bg-slate-100 text-slate-600"
                    }`}>
                      <Bed className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Room {task.room?.room_number}</h3>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                        {task.room?.room_type} • Floor {task.room?.floor}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`
                    ${task.priority === "high" || task.priority === "urgent" ? "bg-red-50 text-red-600 border-red-100" : "bg-slate-50 text-slate-600 border-slate-100"}
                  `}>
                    {task.priority}
                  </Badge>
                </div>

                {task.notes && (
                  <div className="px-4 pb-4">
                    <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 italic">
                      "{task.notes}"
                    </div>
                  </div>
                )}

                <div className="p-4 bg-slate-50/50 border-t flex gap-3">
                  {task.status === "pending" && (
                    <Button
                      className="flex-1 h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold"
                      onClick={() => handleStatusUpdate(task.id, task.status, task.room_id || "")}
                    >
                      <Clock className="h-5 w-5 mr-2" />
                      Start Cleaning
                    </Button>
                  )}
                  {task.status === "in_progress" && (
                    <Button
                      className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                      onClick={() => handleStatusUpdate(task.id, task.status, task.room_id || "")}
                    >
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      Finish & Mark Clean
                    </Button>
                  )}
                  {task.status === "completed" && (
                    <div className="flex-1 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 font-bold border border-emerald-100">
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      Cleaned
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>

      {/* Footer hint */}
      <footer className="p-6 text-center text-slate-400 text-xs">
        <p>Updates are synchronized in real-time with Front Desk</p>
      </footer>
    </div>
  );
}
