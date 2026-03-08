import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Mail, Phone, Star, Grid, List, Users, MessageSquare, Award, Trophy, Loader2, Receipt, FileText, Clock, GitMerge, Zap } from "lucide-react";
import { useGuests, Guest } from "@/hooks/useGuests";
import { GuestDocuments } from "@/components/guests/GuestDocuments";
import { GuestHistoryTimeline } from "@/components/guests/GuestHistoryTimeline";
import { AutomatedMessaging } from "@/components/guests/AutomatedMessaging";
import { GuestMergeTool } from "@/components/guests/GuestMergeTool";
import { useGuestFeedback, useLoyaltyMembers, useGuestStats } from "@/hooks/useGuestManagement";
import { useNavigate } from "react-router-dom";
import { DataTable, Column } from "@/components/ui/data-table";
import { TableSkeleton } from "@/components/skeletons";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { toast } from "sonner";
import { format } from "date-fns";

const statusColors = {
  vip: "bg-primary/20 text-primary border-primary/30",
  regular: "bg-secondary text-secondary-foreground border-border",
  new: "bg-success/20 text-success border-success/30",
};

const tierColors: Record<string, string> = {
  bronze: "bg-amber-700/20 text-amber-600",
  silver: "bg-slate-400/20 text-slate-300",
  gold: "bg-yellow-500/20 text-yellow-400",
  platinum: "bg-purple-500/20 text-purple-400",
};

const feedbackTypeColors: Record<string, string> = {
  review: "bg-blue-500/20 text-blue-400",
  complaint: "bg-destructive/20 text-destructive",
  suggestion: "bg-amber-500/20 text-amber-400",
  compliment: "bg-success/20 text-success",
};

const getGuestStatus = (guest: Guest): "vip" | "regular" | "new" => {
  if (guest.is_vip) return "vip";
  if ((guest.total_visits || 0) <= 1) return "new";
  return "regular";
};

const Guests = () => {
  const navigate = useNavigate();
  const { data: guests = [], isLoading } = useGuests();
  const { data: feedback = [], createFeedback, respondToFeedback, updateStatus } = useGuestFeedback();
  const { data: loyaltyMembers = [], enrollMember, addPoints } = useLoyaltyMembers();
  const stats = useGuestStats();

  // Performance optimization: Use a Set for O(1) membership lookups instead of O(M) .some() calls in the list
  const loyaltyMemberIds = useMemo(() => new Set(loyaltyMembers.map(m => m.guest_id)), [loyaltyMembers]);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  const [newFeedback, setNewFeedback] = useState({
    feedback_type: "review",
    department: "",
    rating: 5,
    title: "",
    message: "",
  });

  const columns: Column<Guest>[] = [
    {
      key: "first_name",
      header: "Guest",
      render: (guest) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-gradient-gold text-primary-foreground text-xs">
              {guest.first_name[0]}{guest.last_name[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <span className="font-medium flex items-center gap-2">
              {guest.first_name} {guest.last_name}
              {guest.is_vip && <Star className="h-3 w-3 text-primary fill-primary" />}
            </span>
          </div>
        </div>
      ),
    },
    { key: "email", header: "Email", render: (guest) => <span className="text-muted-foreground">{guest.email || "-"}</span> },
    { key: "phone", header: "Phone", render: (guest) => <span className="text-muted-foreground">{guest.phone || "-"}</span> },
    { key: "total_visits", header: "Visits", render: (guest) => <span className="font-semibold">{guest.total_visits || 0}</span> },
    { key: "total_spending", header: "Total Spent", render: (guest) => <span className="font-semibold text-primary">${(guest.total_spending || 0).toLocaleString()}</span> },
    {
      key: "is_vip",
      header: "Status",
      sortable: false,
      render: (guest) => {
        const status = getGuestStatus(guest);
        return <Badge variant="outline" className={statusColors[status]}>{status.toUpperCase()}</Badge>;
      },
    },
    {
      key: "id",
      header: "Folio",
      render: (guest) => (
        <Button variant="ghost" size="sm" onClick={() => navigate(`/front-desk?guestId=${guest.id}`)}>
          <Receipt className="h-4 w-4 mr-1" />
          View
        </Button>
      ),
    },
  ];

  const handleEnrollLoyalty = async (guestId: string) => {
    try {
      await enrollMember.mutateAsync(guestId);
      toast.success("Guest enrolled in loyalty program");
    } catch (error) {
      toast.error("Failed to enroll guest");
    }
  };

  const handleAddFeedback = async () => {
    if (!selectedGuest) return;
    try {
      // @ts-expect-error - feedback type in hook might not perfectly match form state
      await createFeedback.mutateAsync({ ...newFeedback, guest_id: selectedGuest.id, status: "pending" });
      toast.success("Feedback recorded");
      setFeedbackDialogOpen(false);
      setNewFeedback({ feedback_type: "review", department: "", rating: 5, title: "", message: "" });
    } catch (error) {
      toast.error("Failed to record feedback");
    }
  };

  return (
    <MainLayout title="Guest Management" subtitle="Guest profiles, loyalty, and feedback">
      <ErrorBoundary>
        <Tabs defaultValue="guests" className="space-y-6">
          <TabsList>
            <TabsTrigger value="guests" className="gap-2">
              <Users className="h-4 w-4" />
              Guests
            </TabsTrigger>
            <TabsTrigger value="feedback" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Feedback
              {stats.pendingFeedback > 0 && <Badge variant="destructive" className="ml-1">{stats.pendingFeedback}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="loyalty" className="gap-2">
              <Award className="h-4 w-4" />
              Loyalty Program
            </TabsTrigger>
          </TabsList>

          <TabsContent value="guests" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
                  <Grid className="h-4 w-4" />
                </Button>
                <Button variant={viewMode === "table" ? "default" : "outline"} size="sm" onClick={() => setViewMode("table")}>
                  <List className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="gold" size="sm" className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Add Guest
              </Button>
            </div>

            {isLoading ? (
              <TableSkeleton columns={6} rows={5} />
            ) : viewMode === "table" ? (
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>All Guests</CardTitle>
                </CardHeader>
                <CardContent>
                  <DataTable data={guests} columns={columns} keyExtractor={(guest) => guest.id} searchPlaceholder="Search guests..." emptyMessage="No guests found." pageSize={10} />
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {guests.map((guest, index) => {
                  const status = getGuestStatus(guest);
                  const isMember = loyaltyMemberIds.has(guest.id);
                  return (
                    <Card key={guest.id} variant="elevated" className="animate-slide-up hover:shadow-glow transition-all cursor-pointer" style={{ animationDelay: `${index * 50}ms` }}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-gradient-gold text-primary-foreground font-semibold">
                                {guest.first_name[0]}{guest.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-foreground flex items-center gap-2">
                                {guest.first_name} {guest.last_name}
                                {guest.is_vip && <Star className="h-4 w-4 text-primary fill-primary" />}
                              </h3>
                              <Badge variant="outline" className={statusColors[status]}>{status.toUpperCase()}</Badge>
                            </div>
                          </div>
                          {isMember && <Trophy className="h-5 w-5 text-primary" />}
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            {guest.email || "-"}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            {guest.phone || "-"}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border mb-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Visits</p>
                            <p className="text-lg font-semibold text-foreground">{guest.total_visits || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Total Spent</p>
                            <p className="text-lg font-semibold text-primary">${(guest.total_spending || 0).toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" className="flex-1 min-w-[100px]" onClick={() => navigate(`/front-desk?guestId=${guest.id}`)}>
                            <Receipt className="h-4 w-4 mr-1" />
                            Folio
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 min-w-[100px]" onClick={() => { setSelectedGuest(guest); setFeedbackDialogOpen(true); }}>
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Feedback
                          </Button>
                          {!isMember && (
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEnrollLoyalty(guest.id)}>
                              <Award className="h-4 w-4 mr-1" />
                              Enroll
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {guests.length === 0 && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">No guests found</div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="feedback" className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Total Feedback</p>
                  <p className="text-2xl font-bold">{stats.totalFeedback}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-amber-500">{stats.pendingFeedback}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Avg Rating</p>
                  <p className="text-2xl font-bold text-primary">{stats.avgRating.toFixed(1)} ★</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Loyalty Members</p>
                  <p className="text-2xl font-bold text-success">{stats.loyaltyMembers}</p>
                </CardContent>
              </Card>
            </div>

            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Guest Feedback</CardTitle>
                <CardDescription>Reviews, complaints, and suggestions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guest</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedback.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No feedback yet</TableCell>
                      </TableRow>
                    ) : (
                      feedback.map((f) => (
                        <TableRow key={f.id}>
                          <TableCell className="font-medium">{f.guest ? `${f.guest.first_name} ${f.guest.last_name}` : "Anonymous"}</TableCell>
                          <TableCell>
                            <Badge className={feedbackTypeColors[f.feedback_type]}>{f.feedback_type}</Badge>
                          </TableCell>
                          <TableCell>{f.rating ? `${f.rating} ★` : "-"}</TableCell>
                          <TableCell className="max-w-xs truncate">{f.message}</TableCell>
                          <TableCell>
                            <Badge className={f.status === "pending" ? "bg-amber-500/20 text-amber-400" : f.status === "resolved" ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"}>
                              {f.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{format(new Date(f.created_at), "MMM d")}</TableCell>
                          <TableCell>
                            {f.status === "pending" && (
                              <Button variant="ghost" size="sm" onClick={() => updateStatus.mutate({ id: f.id, status: "resolved" })}>
                                Resolve
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="loyalty" className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Total Members</p>
                  <p className="text-2xl font-bold">{stats.loyaltyMembers}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Platinum</p>
                  <p className="text-2xl font-bold text-purple-400">{stats.platinumMembers}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Gold</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.goldMembers}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Active Rate</p>
                  <p className="text-2xl font-bold text-success">
                    {guests.length > 0 ? ((stats.loyaltyMembers / guests.length) * 100).toFixed(0) : 0}%
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Loyalty Members</CardTitle>
                <CardDescription>Reward program members and their tiers</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Member #</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Points Balance</TableHead>
                      <TableHead>Lifetime Points</TableHead>
                      <TableHead>Join Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loyaltyMembers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No loyalty members yet</TableCell>
                      </TableRow>
                    ) : (
                      loyaltyMembers.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium">{m.guest ? `${m.guest.first_name} ${m.guest.last_name}` : "-"}</TableCell>
                          <TableCell className="font-mono">{m.member_number}</TableCell>
                          <TableCell>
                            <Badge className={tierColors[m.tier]}>{m.tier.toUpperCase()}</Badge>
                          </TableCell>
                          <TableCell className="font-semibold">{m.points_balance.toLocaleString()}</TableCell>
                          <TableCell>{m.lifetime_points.toLocaleString()}</TableCell>
                          <TableCell>{format(new Date(m.join_date), "MMM d, yyyy")}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Feedback Dialog */}
        <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Guest Feedback</DialogTitle>
              <DialogDescription>
                {selectedGuest ? `For ${selectedGuest.first_name} ${selectedGuest.last_name}` : ""}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={newFeedback.feedback_type} onValueChange={(v) => setNewFeedback({ ...newFeedback, feedback_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="complaint">Complaint</SelectItem>
                      <SelectItem value="suggestion">Suggestion</SelectItem>
                      <SelectItem value="compliment">Compliment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Rating</Label>
                  <Select value={newFeedback.rating.toString()} onValueChange={(v) => setNewFeedback({ ...newFeedback, rating: Number(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((r) => (
                        <SelectItem key={r} value={r.toString()}>{r} ★</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={newFeedback.department} onValueChange={(v) => setNewFeedback({ ...newFeedback, department: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="front_desk">Front Desk</SelectItem>
                    <SelectItem value="housekeeping">Housekeeping</SelectItem>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="spa">Spa</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={newFeedback.title} onChange={(e) => setNewFeedback({ ...newFeedback, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Message *</Label>
                <Textarea value={newFeedback.message} onChange={(e) => setNewFeedback({ ...newFeedback, message: e.target.value })} rows={4} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFeedbackDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddFeedback} disabled={!newFeedback.message || createFeedback.isPending}>
                {createFeedback.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </ErrorBoundary>
    </MainLayout>
  );
};

export default Guests;
