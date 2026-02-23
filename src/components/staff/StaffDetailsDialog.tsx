import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  ChevronRight,
  Send,
  ArrowLeft,
  History,
  Clock,
  Briefcase,
  FileText,
  Edit2,
  Check,
  X,
  Phone,
  Mail,
  Calendar,
  Building2,
  DollarSign,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StaffMember, useUpdateStaff, useStaffTimeClock, useStaffLeaveRequests } from "@/hooks/useStaff";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface StaffDetailsDialogProps {
  staff: StaffMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors: Record<string, string> = {
  active: "bg-success/20 text-success border-success/30",
  inactive: "bg-muted text-muted-foreground border-border",
  on_leave: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  terminated: "bg-destructive/20 text-destructive border-destructive/30",
};

export function StaffDetailsDialog({ staff, open, onOpenChange }: StaffDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState("main-info");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<StaffMember>>({});

  const { toast } = useToast();
  const updateStaff = useUpdateStaff();
  const { data: timeClock = [] } = useStaffTimeClock(staff?.id);
  const { data: leaveRequests = [] } = useStaffLeaveRequests(staff?.id);

  if (!staff) return null;

  const handleSendEmail = () => {
    toast({
      title: "Email Client Opened",
      description: `Opening email composer for ${staff.first_name} ${staff.last_name}.`,
    });
    window.location.href = `mailto:${staff.email}`;
  };

  const handleEdit = () => {
    setEditData({ ...staff });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!staff) return;
    updateStaff.mutate({ id: staff.id, updates: editData }, {
      onSuccess: () => {
        toast({ title: "Staff Updated", description: "Information has been successfully updated." });
        setIsEditing(false);
      },
      onError: (err) => {
        toast({ title: "Update Failed", description: err instanceof Error ? err.message : "An error occurred", variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[95vw] md:w-[90vw] h-[95vh] md:h-[90vh] p-0 overflow-hidden flex flex-col bg-background">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-6 py-4 border-b bg-muted/30 gap-4">
          <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
            <Button variant="ghost" size="sm" className="gap-2 px-2" onClick={() => onOpenChange(false)}>
              <ArrowLeft className="h-4 w-4" />
              BACK
            </Button>
            <div className="h-4 w-px bg-border mx-1 hidden md:block" />
            <h2 className="text-xs md:text-sm font-semibold tracking-wider text-muted-foreground uppercase truncate">
              Staff Profile
            </h2>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <Button variant="success" size="sm" className="gap-2 shrink-0" onClick={handleSendEmail}>
              <Send className="h-4 w-4" />
              SEND EMAIL
            </Button>
          </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r bg-muted/10 p-4 md:p-6 flex flex-col items-center overflow-y-auto max-h-[35vh] md:max-h-full shrink-0">
            <Avatar className="h-24 w-24 md:h-48 md:w-48 rounded-sm mb-3 md:mb-6 border-4 border-background shadow-lg">
              <AvatarFallback className="text-2xl md:text-4xl bg-gradient-gold text-primary-foreground rounded-none">
                {staff.first_name[0]}{staff.last_name[0]}
              </AvatarFallback>
            </Avatar>

            <div className="w-full space-y-4 md:space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg md:text-xl font-bold text-center">
                  {staff.first_name} {staff.last_name}
                </h3>
                <p className="text-sm text-center text-muted-foreground font-medium">{staff.position}</p>
                <div className="flex justify-center mt-2">
                  <Badge variant="outline" className={statusColors[staff.status] || ""}>
                    {staff.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3 md:space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                  <div className="text-sm">
                    <p className="text-muted-foreground text-xs">Employee ID</p>
                    <p className="font-medium font-mono">{staff.employee_id}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                  <div className="text-sm">
                    <p className="text-muted-foreground text-xs">Department</p>
                    <p className="font-medium">{staff.department}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                  <div className="text-sm">
                    <p className="text-muted-foreground text-xs">Email</p>
                    <p className="font-medium break-all">{staff.email || "None"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                  <div className="text-sm">
                    <p className="text-muted-foreground text-xs">Phone</p>
                    <p className="font-medium">{staff.phone || "None"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-2 md:p-4 bg-muted/30 border-b">
                <ScrollArea className="w-full whitespace-nowrap">
                  <TabsList className="bg-transparent h-auto p-0 flex gap-1 w-max">
                    {[
                      "Main Info",
                      "Employment",
                      "Time Clock",
                      "Leave Requests",
                      "Documents",
                      "Notes",
                    ].map((tab) => (
                      <TabsTrigger
                        key={tab}
                        value={tab.toLowerCase().replace(" ", "-")}
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 md:px-4 py-1.5 md:py-2 border rounded-none text-xs md:text-sm transition-colors shrink-0"
                      >
                        {tab}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-4 md:p-6">
                  <TabsContent value="main-info" className="mt-0 space-y-6 md:space-y-8">
                    <section>
                      <div className="flex items-center justify-between mb-4 pb-2 border-b">
                        <h4 className="text-xl font-medium">Personal Information</h4>
                        {!isEditing ? (
                          <Button variant="outline" size="sm" onClick={handleEdit} className="gap-2">
                            <Edit2 className="h-4 w-4" /> Edit Profile
                          </Button>
                        ) : (
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="gap-2">
                              <X className="h-4 w-4" /> Cancel
                            </Button>
                            <Button variant="success" size="sm" onClick={handleSaveEdit} className="gap-2" disabled={updateStaff.isPending}>
                              <Check className="h-4 w-4" /> {updateStaff.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                          </div>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label>First Name</Label>
                            <Input value={editData.first_name || ""} onChange={(e) => setEditData({ ...editData, first_name: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Last Name</Label>
                            <Input value={editData.last_name || ""} onChange={(e) => setEditData({ ...editData, last_name: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={editData.email || ""} onChange={(e) => setEditData({ ...editData, email: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input value={editData.phone || ""} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Emergency Contact Name</Label>
                            <Input value={editData.emergency_contact_name || ""} onChange={(e) => setEditData({ ...editData, emergency_contact_name: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Emergency Contact Phone</Label>
                            <Input value={editData.emergency_contact_phone || ""} onChange={(e) => setEditData({ ...editData, emergency_contact_phone: e.target.value })} />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                          <InfoItem label="First Name" value={staff.first_name} icon={<FileText className="h-4 w-4" />} />
                          <InfoItem label="Last Name" value={staff.last_name} icon={<FileText className="h-4 w-4" />} />
                          <InfoItem label="Email" value={staff.email} icon={<Mail className="h-4 w-4" />} />
                          <InfoItem label="Phone" value={staff.phone} icon={<Phone className="h-4 w-4" />} />
                          <InfoItem label="Emergency Contact" value={staff.emergency_contact_name} icon={<FileText className="h-4 w-4" />} />
                          <InfoItem label="Emergency Phone" value={staff.emergency_contact_phone} icon={<Phone className="h-4 w-4" />} />
                        </div>
                      )}
                    </section>
                  </TabsContent>

                  <TabsContent value="employment" className="mt-0 space-y-8">
                    <section>
                      <h4 className="text-xl font-medium mb-4 pb-2 border-b">Job Details</h4>
                      {isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-2">
                            <Label>Department</Label>
                            <Input value={editData.department || ""} onChange={(e) => setEditData({ ...editData, department: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Position</Label>
                            <Input value={editData.position || ""} onChange={(e) => setEditData({ ...editData, position: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Hire Date</Label>
                            <Input type="date" value={editData.hire_date || ""} onChange={(e) => setEditData({ ...editData, hire_date: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Salary</Label>
                            <Input type="number" value={editData.salary || ""} onChange={(e) => setEditData({ ...editData, salary: parseFloat(e.target.value) })} />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                          <InfoItem label="Department" value={staff.department} icon={<Building2 className="h-4 w-4" />} />
                          <InfoItem label="Position" value={staff.position} icon={<Briefcase className="h-4 w-4" />} />
                          <InfoItem label="Hire Date" value={staff.hire_date ? format(new Date(staff.hire_date), "MMM d, yyyy") : null} icon={<Calendar className="h-4 w-4" />} />
                          <InfoItem label="Salary" value={staff.salary ? `$${staff.salary.toLocaleString()}` : "Not Disclosed"} icon={<DollarSign className="h-4 w-4" />} />
                        </div>
                      )}
                    </section>
                  </TabsContent>

                  <TabsContent value="time-clock" className="mt-0">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-5 w-5" />
                          Recent Attendance
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Clock In</TableHead>
                              <TableHead>Clock Out</TableHead>
                              <TableHead>Duration</TableHead>
                              <TableHead>Notes</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {timeClock.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No attendance records found</TableCell>
                              </TableRow>
                            ) : (
                              timeClock.map((log) => (
                                <TableRow key={log.id}>
                                  <TableCell>{format(new Date(log.clock_in), "MMM d, HH:mm")}</TableCell>
                                  <TableCell>{log.clock_out ? format(new Date(log.clock_out), "MMM d, HH:mm") : "Ongoing"}</TableCell>
                                  <TableCell>
                                    {log.clock_out
                                      ? `${Math.round((new Date(log.clock_out).getTime() - new Date(log.clock_in).getTime()) / 60000)} mins`
                                      : "-"
                                    }
                                  </TableCell>
                                  <TableCell className="max-w-[200px] truncate">{log.notes || "-"}</TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="leave-requests" className="mt-0">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          Leave History
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Type</TableHead>
                              <TableHead>Period</TableHead>
                              <TableHead>Days</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {leaveRequests.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No leave requests found</TableCell>
                              </TableRow>
                            ) : (
                              leaveRequests.map((req) => (
                                <TableRow key={req.id}>
                                  <TableCell className="capitalize">{req.leave_type.replace("_", " ")}</TableCell>
                                  <TableCell>
                                    {format(new Date(req.start_date), "MMM d")} - {format(new Date(req.end_date), "MMM d, yyyy")}
                                  </TableCell>
                                  <TableCell>{req.days_requested}</TableCell>
                                  <TableCell>
                                    <Badge variant={req.status === "approved" ? "success" : req.status === "pending" ? "outline" : "destructive"}>
                                      {req.status}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="documents" className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="border-dashed flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <FileText className="h-12 w-12 mb-4 opacity-20" />
                        <p>No employment contracts uploaded</p>
                        <Button variant="link">Upload Document</Button>
                      </Card>
                      <Card className="border-dashed flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <FileText className="h-12 w-12 mb-4 opacity-20" />
                        <p>No identification documents uploaded</p>
                        <Button variant="link">Upload Document</Button>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="notes" className="mt-0">
                    <div className="space-y-4">
                      <Label>Internal Staff Notes</Label>
                      <Textarea
                        placeholder="Add professional notes about performance, feedback, etc..."
                        className="min-h-[200px]"
                        defaultValue={staff.notes || ""}
                      />
                      <div className="flex justify-end">
                        <Button variant="primary">Save Notes</Button>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoItem({ label, value, icon }: { label: string; value: string | null | undefined; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-muted/50 last:border-0">
      <div className="flex items-center gap-2">
        {icon && <div className="text-muted-foreground">{icon}</div>}
        <span className="text-sm font-medium text-muted-foreground">{label}:</span>
      </div>
      <span className="text-sm font-semibold">{value || "-"}</span>
    </div>
  );
}
