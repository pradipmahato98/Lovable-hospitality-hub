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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Guest, useGuests } from "@/hooks/useGuests";
import { useGuestLoyalty, useGuestCommunications, useGuestPreferences, useMergeGuests } from "@/hooks/useGuestManagement";
import { useGuestReservations } from "@/hooks/useReservations";
import { Input } from "@/components/ui/input";
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
  const [mergeSearch, setMergeSearch] = useState("");
  const { toast } = useToast();
  const { data: allGuests = [] } = useGuests();
  const { data: loyaltyMember = null } = useGuestLoyalty(guest?.id);
  const { data: communications = [] } = useGuestCommunications(guest?.id);
  const { data: preferences = [] } = useGuestPreferences(guest?.id);
  const { data: guestReservations = [] } = useGuestReservations(guest?.id);
  const mergeMutation = useMergeGuests();

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
                      <h4 className="text-xl font-medium mb-4 pb-2 border-b">Main Information</h4>
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

                  <TabsContent value="preference" className="mt-0">
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
                  </TabsContent>

                  <TabsContent value="change-history" className="mt-0">
                    <Card>
                      <CardHeader>
                        <CardTitle>Profile Change History</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex gap-4 p-4 border rounded-lg bg-muted/20">
                            <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                            <div>
                              <p className="font-medium">Profile Created</p>
                              <p className="text-sm text-muted-foreground">System • {format(new Date(guest.created_at), "MMM d, yyyy HH:mm")}</p>
                            </div>
                          </div>
                          {guest.updated_at !== guest.created_at && (
                            <div className="flex gap-4 p-4 border rounded-lg bg-muted/20">
                              <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                              <div>
                                <p className="font-medium">Profile Updated</p>
                                <p className="text-sm text-muted-foreground">System • {format(new Date(guest.updated_at), "MMM d, yyyy HH:mm")}</p>
                              </div>
                            </div>
                          )}
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
