import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Mail, Phone, Star, Grid, List, Users, MessageSquare, Award, Trophy, Loader2, Receipt, MoreHorizontal, Eye, Edit, Trash } from "lucide-react";
import { useGuests, Guest } from "@/hooks/useGuests";
import { useGuestFeedback, useLoyaltyMembers, useGuestStats } from "@/hooks/useGuestManagement";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuickActions } from "@/contexts/QuickActionsContext";
import { GuestDetailsDialog } from "@/components/guests/GuestDetailsDialog";
import { DataTable, Column } from "@/components/ui/data-table";
import { TableSkeleton } from "@/components/skeletons";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useIsAdmin } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { useEffect } from "react";

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
  const queryClient = useQueryClient();
  const { isAdmin } = useIsAdmin();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: guests = [], isLoading } = useGuests();
  const { data: feedback = [], createFeedback, respondToFeedback, updateStatus } = useGuestFeedback();
  const { data: loyaltyMembers = [], enrollMember, addPoints } = useLoyaltyMembers();
  const stats = useGuestStats();
  const { setNewGuestOpen } = useQuickActions();

  // Performance optimization: Use a Set for O(1) membership lookups instead of O(M) .some() calls in the list
  const loyaltyMemberIds = useMemo(() => new Set(loyaltyMembers.map(m => m.guest_id)), [loyaltyMembers]);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  const deleteGuestMutation = useMutation({
    mutationFn: async (guestId: string) => {
      const { error } = await supabase.from("guests").delete().eq("id", guestId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Guest profile deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      setDeleteDialogOpen(false);
      setSelectedGuest(null);
    },
    onError: (error) => {
      toast.error("Failed to delete guest: " + error.message);
    },
  });

  const handleDeleteGuest = () => {
    if (selectedGuest) {
      deleteGuestMutation.mutate(selectedGuest.id);
    }
  };

  const guestIdFromUrl = searchParams.get("guestId");

  useEffect(() => {
    if (guestIdFromUrl && guests.length > 0) {
      const guest = guests.find(g => g.id === guestIdFromUrl);
      if (guest) {
        setSelectedGuest(guest);
        setDetailsDialogOpen(true);
        // Clear param
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("guestId");
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [guestIdFromUrl, guests, searchParams, setSearchParams]);

  const filteredGuests = useMemo(() => {
    if (!searchQuery.trim()) return guests;
    const query = searchQuery.toLowerCase();
    return guests.filter((g) =>
      `${g.first_name} ${g.last_name}`.toLowerCase().includes(query) ||
      g.email?.toLowerCase().includes(query) ||
      g.phone?.toLowerCase().includes(query)
    );
  }, [guests, searchQuery]);

  const [newFeedback, setNewFeedback] = useState({
    feedback_type: "review",
    department: "",
    rating: 5,
    title: "",
    message: "",
  });

  const columns: Column<Guest>[] = [
    {
      key: "actions",
      header: "",
      className: "w-[50px]",
      render: (guest) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { setSelectedGuest(guest); setDetailsDialogOpen(true); }}>
              <Eye className="mr-2 h-4 w-4 text-muted-foreground" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/front-desk?guestId=${guest.id}`)}>
              <Receipt className="mr-2 h-4 w-4 text-muted-foreground" /> View Folio
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setSelectedGuest(guest); setFeedbackDialogOpen(true); }}>
              <MessageSquare className="mr-2 h-4 w-4 text-muted-foreground" /> Add Feedback
            </DropdownMenuItem>
            {!loyaltyMemberIds.has(guest.id) && (
              <DropdownMenuItem onClick={() => handleEnrollLoyalty(guest.id)}>
                <Award className="mr-2 h-4 w-4 text-muted-foreground" /> Enroll Loyalty
              </DropdownMenuItem>
            )}
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => { setSelectedGuest(guest); setDeleteDialogOpen(true); }}
                >
                  <Trash className="mr-2 h-4 w-4" /> Delete Profile
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
    {
      key: "first_name",
      header: "Guest",
      render: (guest) => (
        <div
          className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors"
          onClick={() => { setSelectedGuest(guest); setDetailsDialogOpen(true); }}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={guest.image_url || guest.id_image_url || ""} className="object-cover" />
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
        return <Badge variant="outline" className={statusColors[status]}>{status?.toUpperCase() || ""}</Badge>;
      },
    },
    {
      key: "folio",
      header: "Folio",
      render: (guest) => (
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-xs font-semibold h-8"
          onClick={() => navigate(`/front-desk?guestId=${guest.id}`)}
        >
          <Receipt className="h-3.5 w-3.5" />
          FOLIO
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

  const [activeMainTab, setActiveMainTab] = useState("guests");

  return (
    <MainLayout title="Guest Management" subtitle="Guest profiles, loyalty, and feedback">
      <ErrorBoundary>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full sm:w-auto">
            <ScrollArea className="w-full whitespace-nowrap">
              <TabsList className="w-full sm:w-auto">
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
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </Tabs>

          <Button
            variant="gold"
            size="sm"
            className="gap-2 w-full sm:w-auto shadow-md hover:shadow-lg transition-all"
            onClick={() => setNewGuestOpen(true)}
          >
            <Plus className="h-4 w-4" />
            New Profile
          </Button>
        </div>

        <Tabs value={activeMainTab} className="space-y-6">

          <TabsContent value="guests" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button variant={viewMode === "table" ? "default" : "outline"} size="sm" onClick={() => setViewMode("table")}>
                    <List className="h-4 w-4" />
                  </Button>
                </div>
                <div className="relative flex-1 sm:w-64">
                  <Plus className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground hidden" />
                  <Input
                    placeholder="Search profiles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-4"
                  />
                </div>
              </div>
            </div>

            {isLoading ? (
              <TableSkeleton columns={6} rows={5} />
            ) : viewMode === "table" ? (
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>All Guests</CardTitle>
                </CardHeader>
                <CardContent>
                  <DataTable
                    data={filteredGuests}
                    columns={columns}
                    keyExtractor={(guest) => guest.id}
                    showSearch={false}
                    emptyMessage="No guests found."
                    pageSize={10}
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {filteredGuests.map((guest, index) => {
                  const status = getGuestStatus(guest);
                  const isMember = loyaltyMemberIds.has(guest.id);
                  return (
                    <Card
                      key={guest.id}
                      variant="elevated"
                      className="animate-slide-up hover:shadow-glow transition-all cursor-pointer"
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={() => { setSelectedGuest(guest); setDetailsDialogOpen(true); }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={guest.image_url || guest.id_image_url || ""} className="object-cover" />
                              <AvatarFallback className="bg-gradient-gold text-primary-foreground font-semibold">
                                {guest.first_name[0]}{guest.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-foreground flex items-center gap-2">
                                {guest.first_name} {guest.last_name}
                                {guest.is_vip && <Star className="h-4 w-4 text-primary fill-primary" />}
                              </h3>
                              <Badge variant="outline" className={statusColors[status]}>{status?.toUpperCase() || ""}</Badge>
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

                        <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
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
                            <Badge className={tierColors[m.tier] || ""}>{m.tier?.toUpperCase() || ""}</Badge>
                          </TableCell>
                          <TableCell className="font-semibold">{(m.points_balance || 0).toLocaleString()}</TableCell>
                          <TableCell>{(m.lifetime_points || 0).toLocaleString()}</TableCell>
                          <TableCell>{m.join_date ? format(new Date(m.join_date), "MMM d, yyyy") : "-"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Guest Details Dialog */}
        <GuestDetailsDialog
          guest={selectedGuest}
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the profile for
                <strong> {selectedGuest?.first_name} {selectedGuest?.last_name}</strong> and remove all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteGuest}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteGuestMutation.isPending}
              >
                {deleteGuestMutation.isPending ? "Deleting..." : "Delete Profile"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
