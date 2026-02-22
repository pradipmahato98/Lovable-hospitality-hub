import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Star,
  ChevronRight,
  Send,
  GitMerge,
  ArrowLeft,
  History,
  CreditCard,
  BarChart3,
  Search,
  Edit2,
  Check,
  X,
  FileText,
  Plus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Guest, useGuests, useUpdateGuest } from "@/hooks/useGuests";
import {
  useGuestLoyalty,
  useGuestCommunications,
  useGuestPreferences,
  useMergeGuests,
  useGuestAuditLogs,
  useGuestDocuments,
  useAddGuestDocument,
} from "@/hooks/useGuestManagement";
import { useGuestReservations } from "@/hooks/useReservations";
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

interface GuestDetailsDialogProps {
  guest: Guest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GuestDetailsDialog({ guest, open, onOpenChange }: GuestDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState("main-info");
  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [mergeSearch, setMergeSearch] = useState("");
  const [editData, setEditData] = useState<Partial<Guest>>({});
  const [newDoc, setNewDoc] = useState({ type: "", number: "", image_url: "" });

  const { toast } = useToast();
  const { data: allGuests = [] } = useGuests();
  const { data: loyaltyMember = null } = useGuestLoyalty(guest?.id);
  const { data: communications = [] } = useGuestCommunications(guest?.id);
  const { data: preferences = [] } = useGuestPreferences(guest?.id);
  const { data: guestReservations = [] } = useGuestReservations(guest?.id);
  const { data: auditLogs = [] } = useGuestAuditLogs(guest?.id);
  const { data: documents = [] } = useGuestDocuments(guest?.id);

  const updateGuest = useUpdateGuest();
  const mergeMutation = useMergeGuests();
  const addDocument = useAddGuestDocument();

  const stayHistory = useMemo(() =>
    guestReservations.filter(r => r.status === "checked_out"),
    [guestReservations]
  );

  const currentReservations = useMemo(() =>
    guestReservations.filter(r => r.status !== "checked_out" && r.status !== "cancelled"),
    [guestReservations]
  );

  if (!guest) return null;

  const handleSendEmail = () => {
    toast({
      title: "Email Client Opened",
      description: `Opening email composer for ${guest.first_name} ${guest.last_name}.`,
    });
    window.location.href = `mailto:${guest.email}`;
  };

  const handleMerge = (targetGuest: Guest) => {
    if (!guest) return;

    mergeMutation.mutate({
      sourceGuestId: targetGuest.id, // We merge target into current
      targetGuestId: guest.id,
    }, {
      onSuccess: () => {
        toast({
          title: "Profiles Merged",
          description: `Successfully merged ${targetGuest.first_name} ${targetGuest.last_name} into ${guest.first_name} ${guest.last_name}.`,
        });
        setIsMergeDialogOpen(false);
      },
      onError: (error) => {
        toast({
          title: "Merge Failed",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive",
        });
      }
    });
  };

  const filteredMergeGuests = useMemo(() => {
    if (!mergeSearch) return [];
    return allGuests.filter(g =>
      g.id !== guest?.id &&
      (`${g.first_name} ${g.last_name}`.toLowerCase().includes(mergeSearch.toLowerCase()) ||
       g.email?.toLowerCase().includes(mergeSearch.toLowerCase()))
    );
  }, [allGuests, mergeSearch, guest]);

  const handleEdit = () => {
    setEditData({ ...guest });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!guest) return;
    updateGuest.mutate({ id: guest.id, updates: editData }, {
      onSuccess: () => {
        toast({ title: "Profile Updated", description: "Guest information has been successfully updated." });
        setIsEditing(false);
      },
      onError: (err) => {
        toast({ title: "Update Failed", description: err instanceof Error ? err.message : "An error occurred", variant: "destructive" });
      }
    });
  };

  const handleAddDoc = () => {
    if (!guest) return;
    addDocument.mutate({
      guestId: guest.id,
      doc: {
        document_type: newDoc.type,
        document_number: newDoc.number,
        document_image_url: newDoc.image_url
      }
    }, {
      onSuccess: () => {
        toast({ title: "ID Card Added", description: "New identity document has been recorded." });
        setIsAddingDoc(false);
        setNewDoc({ type: "", number: "", image_url: "" });
      },
      onError: (err) => {
        toast({ title: "Failed to add ID", description: err instanceof Error ? err.message : "An error occurred", variant: "destructive" });
      }
    });
  };

  return (
    <>
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
              Membership Account
            </h2>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <Button variant="success" size="sm" className="gap-2 shrink-0" onClick={handleSendEmail}>
              <Send className="h-4 w-4" />
              SEND EMAIL
            </Button>
            <Button variant="warning" size="sm" className="gap-2 shrink-0" onClick={() => setIsMergeDialogOpen(true)}>
              <GitMerge className="h-4 w-4" />
              MERGE
            </Button>
          </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r bg-muted/10 p-4 md:p-6 flex flex-col items-center overflow-y-auto max-h-[35vh] md:max-h-full shrink-0">
            <Avatar className="h-24 w-24 md:h-48 md:w-48 rounded-sm mb-3 md:mb-6 border-4 border-background shadow-lg">
              <AvatarImage src={guest.image_url || guest.id_image_url || ""} alt={`${guest.first_name} ${guest.last_name}`} className="object-cover" />
              <AvatarFallback className="text-2xl md:text-4xl bg-gradient-gold text-primary-foreground rounded-none">
                {guest.first_name[0]}{guest.last_name[0]}
              </AvatarFallback>
            </Avatar>

            <div className="w-full space-y-4 md:space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg md:text-xl font-bold text-center flex items-center justify-center gap-2">
                  {guest.first_name} {guest.last_name}
                  {guest.is_vip && <Star className="h-5 w-5 text-primary fill-primary" />}
                </h3>
              </div>

              <div className="space-y-3 md:space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                  <div className="text-sm">
                    <p className="text-muted-foreground text-xs">Guest Name</p>
                    <p className="font-medium">{guest.first_name} {guest.last_name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                  <div className="text-sm">
                    <p className="text-muted-foreground text-xs">Membership Number</p>
                    <p className="font-medium font-mono">{loyaltyMember?.member_number || "None"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                  <div className="text-sm">
                    <p className="text-muted-foreground text-xs">Email</p>
                    <p className="font-medium break-all">{guest.email || "None"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                  <div className="text-sm">
                    <p className="text-muted-foreground text-xs">Phone</p>
                    <p className="font-medium">{guest.phone || "None"}</p>
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
                      "Statistics",
                      "Communication",
                      "Stay History",
                      "Reservation",
                      "Preference",
                      "Change History",
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
                    {/* Main Information */}
                    <section>
                      <div className="flex items-center justify-between mb-4 pb-2 border-b">
                        <h4 className="text-xl font-medium">Main Information</h4>
                        {!isEditing ? (
                          <Button variant="outline" size="sm" onClick={handleEdit} className="gap-2">
                            <Edit2 className="h-4 w-4" /> Edit Profile
                          </Button>
                        ) : (
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="gap-2">
                              <X className="h-4 w-4" /> Cancel
                            </Button>
                            <Button variant="success" size="sm" onClick={handleSaveEdit} className="gap-2" disabled={updateGuest.isPending}>
                              <Check className="h-4 w-4" /> {updateGuest.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                          </div>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label>Title</Label>
                            <Input value={editData.title || ""} onChange={(e) => setEditData({ ...editData, title: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Date of Birth</Label>
                            <Input type="date" value={editData.date_of_birth || ""} onChange={(e) => setEditData({ ...editData, date_of_birth: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>First Name</Label>
                            <Input value={editData.first_name || ""} onChange={(e) => setEditData({ ...editData, first_name: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Last Name</Label>
                            <Input value={editData.last_name || ""} onChange={(e) => setEditData({ ...editData, last_name: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Nationality</Label>
                            <Input value={editData.nationality || ""} onChange={(e) => setEditData({ ...editData, nationality: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Company</Label>
                            <Input value={editData.company || ""} onChange={(e) => setEditData({ ...editData, company: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Job Title</Label>
                            <Input value={editData.job_title || ""} onChange={(e) => setEditData({ ...editData, job_title: e.target.value })} />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label>Address</Label>
                            <Textarea value={editData.address || ""} onChange={(e) => setEditData({ ...editData, address: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>City</Label>
                            <Input value={editData.city || ""} onChange={(e) => setEditData({ ...editData, city: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Country</Label>
                            <Input value={editData.country || ""} onChange={(e) => setEditData({ ...editData, country: e.target.value })} />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                          <InfoItem label="Title" value={guest.title} />
                          <InfoItem label="Date Of Birth" value={guest.date_of_birth ? format(new Date(guest.date_of_birth), "dd/MM/yyyy") : null} />
                          <InfoItem label="First Name" value={guest.first_name} />
                          <InfoItem label="Last Name" value={guest.last_name} />
                          <InfoItem label="Gender" value={guest.gender} />
                          <InfoItem label="Nationality" value={guest.nationality} />
                          <InfoItem label="Company" value={guest.company} />
                          <InfoItem label="Job Title" value={guest.job_title} />
                          <InfoItem label="Document Type" value={guest.id_type} />
                          <InfoItem label="Document ID" value={guest.id_number} />
                          <InfoItem label="Region" value={guest.region} />
                          <InfoItem label="Country" value={guest.country} />
                          <InfoItem label="State/Province" value={guest.state_province} />
                          <InfoItem label="Subscribed Property" value={guest.subscribed_property} />
                        </div>
                      )}
                    </section>

                    {/* Membership Information */}
                    <section>
                      <h4 className="text-xl font-medium mb-4 pb-2 border-b">Membership Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                        <InfoItem label="Membership Number" value={loyaltyMember?.member_number} />
                        <InfoItem label="Membership Tier" value={loyaltyMember?.tier} />
                        <InfoItem label="Member Since" value={loyaltyMember?.join_date ? format(new Date(loyaltyMember.join_date), "dd/MM/yyyy") : null} />
                        <InfoItem label="Member Status" value={loyaltyMember?.is_active ? "Active" : "Inactive"} />
                        <InfoItem label="Inactive Date" value={loyaltyMember?.inactive_date ? format(new Date(loyaltyMember.inactive_date), "dd/MM/yyyy") : null} />
                        <InfoItem label="Property Name" value={loyaltyMember?.property_name} />
                        <InfoItem label="Referred By" value={loyaltyMember?.referred_by} />
                        <InfoItem label="Journey Start Date" value={loyaltyMember?.journey_start_date ? format(new Date(loyaltyMember.journey_start_date), "dd/MM/yyyy") : null} />
                      </div>
                    </section>
                  </TabsContent>

                  <TabsContent value="statistics" className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <StatCard title="Total Visits" value={guest.total_visits || 0} icon={<History className="h-5 w-5" />} />
                      <StatCard title="Total Spending" value={`$${(guest.total_spending || 0).toLocaleString()}`} icon={<CreditCard className="h-5 w-5" />} />
                      <StatCard title="Points Balance" value={loyaltyMember?.points_balance?.toLocaleString() || 0} icon={<Star className="h-5 w-5" />} />
                      <StatCard title="Lifetime Points" value={loyaltyMember?.lifetime_points?.toLocaleString() || 0} icon={<BarChart3 className="h-5 w-5" />} />
                    </div>
                  </TabsContent>

                  <TabsContent value="communication" className="mt-0">
                    <Card>
                      <CardHeader>
                        <CardTitle>Communication History</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Channel</TableHead>
                              <TableHead>Subject</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {communications.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No communication records found</TableCell>
                              </TableRow>
                            ) : (
                              communications.map((c) => (
                                <TableRow key={c.id}>
                                  <TableCell className="capitalize">{c.channel}</TableCell>
                                  <TableCell>{c.subject || "No Subject"}</TableCell>
                                  <TableCell>
                                    <Badge variant={c.status === "sent" ? "success" : "secondary"}>{c.status}</Badge>
                                  </TableCell>
                                  <TableCell>{format(new Date(c.created_at), "MMM d, yyyy HH:mm")}</TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="stay-history" className="mt-0">
                    <Card>
                      <CardHeader>
                        <CardTitle>Stay History</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Reservation #</TableHead>
                              <TableHead>Check In</TableHead>
                              <TableHead>Check Out</TableHead>
                              <TableHead>Room</TableHead>
                              <TableHead>Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {stayHistory.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No past stays found</TableCell>
                              </TableRow>
                            ) : (
                              stayHistory.map((r) => (
                                <TableRow key={r.id}>
                                  <TableCell className="font-mono">{r.reservation_code}</TableCell>
                                  <TableCell>{format(new Date(r.check_in_date), "MMM d, yyyy")}</TableCell>
                                  <TableCell>{format(new Date(r.check_out_date), "MMM d, yyyy")}</TableCell>
                                  <TableCell>{r.room?.room_number || "-"}</TableCell>
                                  <TableCell>${r.total_amount.toLocaleString()}</TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="reservation" className="mt-0">
                    <Card>
                      <CardHeader>
                        <CardTitle>Current & Future Reservations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Reservation #</TableHead>
                              <TableHead>Check In</TableHead>
                              <TableHead>Check Out</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Room</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentReservations.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No active reservations found</TableCell>
                              </TableRow>
                            ) : (
                              currentReservations.map((r) => (
                                <TableRow key={r.id}>
                                  <TableCell className="font-mono">{r.reservation_code}</TableCell>
                                  <TableCell>{format(new Date(r.check_in_date), "MMM d, yyyy")}</TableCell>
                                  <TableCell>{format(new Date(r.check_out_date), "MMM d, yyyy")}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="capitalize">{r.status?.replace("_", " ") || ""}</Badge>
                                  </TableCell>
                                  <TableCell>{r.room?.room_number || "-"}</TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="preference" className="mt-0 space-y-8">
                    <section>
                      <h4 className="text-xl font-medium mb-4 pb-2 border-b">Guest Preferences</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {preferences.length === 0 ? (
                          <p className="col-span-full text-center py-8 text-muted-foreground">No preferences recorded</p>
                        ) : (
                          preferences.map((p) => (
                            <Card key={p.id}>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase">{p.category}</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="font-semibold">{p.preference_key}</p>
                                <p className="text-sm text-muted-foreground">{p.preference_value || "No details"}</p>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </section>

                    <section>
                      <div className="flex items-center justify-between mb-4 pb-2 border-b">
                        <h4 className="text-xl font-medium">ID Card History</h4>
                        <Button variant="outline" size="sm" onClick={() => setIsAddingDoc(true)} className="gap-2">
                          <Plus className="h-4 w-4" /> Add New ID
                        </Button>
                      </div>

                      {isAddingDoc && (
                        <Card className="mb-6 border-primary/30 bg-primary/5">
                          <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div className="space-y-2">
                                <Label>ID Type</Label>
                                <Input placeholder="Passport, DL, etc." value={newDoc.type} onChange={(e) => setNewDoc({ ...newDoc, type: e.target.value })} />
                              </div>
                              <div className="space-y-2">
                                <Label>ID Number</Label>
                                <Input placeholder="Number" value={newDoc.number} onChange={(e) => setNewDoc({ ...newDoc, number: e.target.value })} />
                              </div>
                              <div className="space-y-2">
                                <Label>Image URL</Label>
                                <Input placeholder="URL" value={newDoc.image_url} onChange={(e) => setNewDoc({ ...newDoc, image_url: e.target.value })} />
                              </div>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => setIsAddingDoc(false)}>Cancel</Button>
                              <Button variant="primary" size="sm" onClick={handleAddDoc} disabled={!newDoc.type || !newDoc.number || addDocument.isPending}>
                                {addDocument.isPending ? "Adding..." : "Add ID Card"}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      <div className="space-y-3">
                        {documents.length === 0 ? (
                          <p className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">No document history found</p>
                        ) : (
                          documents.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/30 transition-colors">
                              <div className="flex items-center gap-4">
                                <div className="p-2 bg-primary/10 rounded-full text-primary">
                                  <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold">{doc.document_type}: {doc.document_number}</p>
                                    {doc.is_latest && <Badge variant="success" className="text-[10px] h-4">LATEST</Badge>}
                                  </div>
                                  <p className="text-xs text-muted-foreground">Added on {format(new Date(doc.created_at), "MMM d, yyyy HH:mm")}</p>
                                </div>
                              </div>
                              {doc.document_image_url && (
                                <Button variant="link" size="sm" onClick={() => window.open(doc.document_image_url || "", "_blank")}>View Image</Button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </section>
                  </TabsContent>

                  <TabsContent value="change-history" className="mt-0">
                    <Card>
                      <CardHeader>
                        <CardTitle>Timeline History</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {auditLogs.length === 0 ? (
                            <div className="text-center py-12">
                              <History className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                              <p className="text-muted-foreground">No detailed change history recorded yet.</p>
                            </div>
                          ) : (
                            auditLogs.map((log) => (
                              <div key={log.id} className="relative pl-6 border-l-2 border-muted pb-6 last:pb-0">
                                <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-background border-2 border-primary" />
                                <div className="flex items-center justify-between mb-1">
                                  <p className="font-semibold text-sm capitalize">{log.action.replace("_", " ")}</p>
                                  <p className="text-xs text-muted-foreground">{format(new Date(log.created_at), "MMM d, yyyy HH:mm")}</p>
                                </div>
                                <p className="text-xs text-muted-foreground mb-2">Performed by: <span className="text-foreground font-medium">{log.staff_name || "System"}</span></p>
                                {log.details && (
                                  <div className="p-3 bg-muted/50 rounded-md text-xs space-y-1">
                                    {Object.entries(log.details).map(([key, val]: [string, any]) => (
                                      <p key={key}>
                                        <span className="font-medium capitalize">{key.replace("_", " ")}:</span>{" "}
                                        <span className="text-muted-foreground line-through decoration-destructive/50">{String(val.old || "None")}</span>{" "}
                                        <ChevronRight className="h-3 w-3 inline mx-1" />{" "}
                                        <span className="text-success font-medium">{String(val.new || "None")}</span>
                                      </p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))
                          )}

                          {/* Initial Creation Log (Legacy) */}
                          <div className="relative pl-6 border-l-2 border-muted pb-0">
                            <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-background border-2 border-muted-foreground/30" />
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold text-sm">Profile Created</p>
                              <p className="text-xs text-muted-foreground">{format(new Date(guest.created_at), "MMM d, yyyy HH:mm")}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">Initial registration in system.</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Merge Dialog */}
    <Dialog open={isMergeDialogOpen} onOpenChange={setIsMergeDialogOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Merge Profiles</DialogTitle>
          <DialogDescription>
            Search for another guest profile to merge into <strong>{guest.first_name} {guest.last_name}</strong>.
            All data from the source profile will be moved and the source profile will be deleted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              className="pl-8"
              value={mergeSearch}
              onChange={(e) => setMergeSearch(e.target.value)}
            />
          </div>

          <ScrollArea className="h-[300px] border rounded-md p-2">
            {filteredMergeGuests.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {mergeSearch ? "No guests found matching your search." : "Start typing to search for guests..."}
              </p>
            ) : (
              <div className="space-y-2">
                {filteredMergeGuests.map((g) => (
                  <div key={g.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={g.image_url || g.id_image_url || ""} />
                        <AvatarFallback>{g.first_name[0]}{g.last_name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{g.first_name} {g.last_name}</p>
                        <p className="text-xs text-muted-foreground">{g.email || g.phone || "No contact info"}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMerge(g)}
                      disabled={mergeMutation.isPending}
                    >
                      {mergeMutation.isPending && mergeMutation.variables?.sourceGuestId === g.id ? "Merging..." : "Merge"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsMergeDialogOpen(false)}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

function InfoItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid grid-cols-2 gap-4 py-1 border-b border-muted/50 last:border-0">
      <span className="text-sm font-medium text-muted-foreground">{label}:</span>
      <span className="text-sm font-semibold">{value || "-"}</span>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-full text-primary">
            {icon}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
