import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Plus,
  Search,
  Loader2,
  Phone,
  Mail,
  Building2,
  Calendar,
  Edit,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useIsAdmin } from "@/hooks/useUserRole";
import { useStaff, useUpdateStaff, StaffMember } from "@/hooks/useStaff";
import { StaffDetailsDialog } from "./StaffDetailsDialog";
import { StaffAddEditDialog } from "./StaffAddEditDialog";
import { useSearchParams } from "react-router-dom";
import { useQuickActions } from "@/contexts/QuickActionsContext";

const departments = [
  "Front Desk",
  "Housekeeping",
  "Food & Beverage",
  "Maintenance",
  "Security",
  "Management",
  "Accounting",
  "Human Resources",
];

const statusColors: Record<string, string> = {
  active: "bg-success/20 text-success border-success/30",
  inactive: "bg-muted text-muted-foreground border-border",
  on_leave: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  terminated: "bg-destructive/20 text-destructive border-destructive/30",
};

export const StaffDirectoryTab = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const { setNewStaffOpen } = useQuickActions();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  const staffIdFromUrl = searchParams.get("staffId");
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const { isAdmin } = useIsAdmin();
  const queryClient = useQueryClient();

  // Fetch staff members
  const { data: staffMembers = [], isLoading } = useStaff();

  // Handle staffId from URL
  useEffect(() => {
    if (staffIdFromUrl && staffMembers.length > 0) {
      const staff = staffMembers.find(s => s.id === staffIdFromUrl);
      if (staff) {
        setSelectedStaff(staff);
        setDetailsOpen(true);
        // Clear the param after opening
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("staffId");
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [staffIdFromUrl, staffMembers, searchParams, setSearchParams]);

  // Delete staff member
  const deleteStaff = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("staff_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-members"] });
      toast.success("Staff member removed");
    },
    onError: (error) => {
      toast.error("Failed to delete staff: " + error.message);
    },
  });

  const handleEdit = (e: React.MouseEvent, staff: StaffMember) => {
    e.stopPropagation();
    setEditingStaff(staff);
    setNewStaffOpen(true);
  };

  const handleRowClick = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setDetailsOpen(true);
  };

  // Filter staff
  const filteredStaff = staffMembers.filter((staff) => {
    const matchesSearch =
      staff.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = !departmentFilter || staff.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Staff Directory
            </CardTitle>
            <CardDescription>
              {staffMembers.length} total staff members
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full sm:w-48"
              />
            </div>
            <Select
              value={departmentFilter || "all"}
              onValueChange={(v) => setDepartmentFilter(v === "all" ? null : v)}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isAdmin && (
              <Button variant="gold" className="gap-2" onClick={() => {
                setEditingStaff(null);
                setNewStaffOpen(true);
              }}>
                <Plus className="h-4 w-4" />
                Add Staff
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Hire Date</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 7 : 6} className="text-center text-muted-foreground py-8">
                      No staff members found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStaff.map((staff) => (
                    <TableRow
                      key={staff.id}
                      className="cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => handleRowClick(staff)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {staff.first_name[0]}
                              {staff.last_name[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">
                              {staff.first_name} {staff.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">{staff.employee_id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {staff.department}
                        </div>
                      </TableCell>
                      <TableCell>{staff.position}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {staff.email && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {staff.email}
                            </div>
                          )}
                          {staff.phone && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {staff.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[staff.status] || statusColors.inactive}>
                          {staff.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(staff.hire_date), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(staff);
                          }}>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <>
                              <Button variant="ghost" size="icon" onClick={(e) => handleEdit(e, staff)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteStaff.mutate(staff.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <StaffDetailsDialog
        staff={selectedStaff}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      <StaffAddEditDialog
        editingStaff={editingStaff}
        onClose={() => setEditingStaff(null)}
      />
    </Card>
  );
};
