import { useState, useMemo } from "react";
import { useReservations, Reservation } from "@/hooks/useReservations";
import { useRooms } from "@/hooks/useRooms";
import { useGuestFolios } from "@/hooks/useGuestFolios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Users,
  Home,
  Calendar,
  MoreVertical,
  ArrowRightLeft,
  CalendarPlus,
  Receipt,
  User,
  Filter,
  LogOut,
  CreditCard,
  Star,
  Loader2,
  ArrowUpCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format, isSameDay, parseISO } from "date-fns";
import { cn, formatCurrency } from "@/lib/utils";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const InHouseGuestManager = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const { reservations, isLoading: loadingRes, updateReservation } = useReservations();
  const { data: rooms = [] } = useRooms();
  const { folios } = useGuestFolios();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "due-out" | "stay-over" | "vip">("all");

  // Room Move State
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [isRoomMoveOpen, setIsRoomMoveOpen] = useState(false);
  const [targetRoomId, setTargetRoomId] = useState("");
  const [moveReason, setMoveReason] = useState("");

  // Extend Stay State
  const [isExtendStayOpen, setIsExtendStayOpen] = useState(false);
  const [newCheckOutDate, setNewCheckOutDate] = useState("");

  // Quick Post State
  const [isQuickPostOpen, setIsQuickPostOpen] = useState(false);
  const [quickPostData, setQuickPostData] = useState({
    description: "",
    amount: 0,
    source: "manual"
  });
  const { addFolioItem } = useGuestFolios();

  const inHouseGuests = useMemo(() => {
    return reservations.filter(r => r.status === 'checked-in');
  }, [reservations]);

  const filteredGuests = useMemo(() => {
    let result = inHouseGuests;

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(g =>
        `${g.guest?.first_name} ${g.guest?.last_name}`.toLowerCase().includes(lowerQuery) ||
        g.room?.room_number.toLowerCase().includes(lowerQuery) ||
        g.reservation_code.toLowerCase().includes(lowerQuery)
      );
    }

    if (statusFilter === "due-out") {
      const today = new Date();
      result = result.filter(g => isSameDay(parseISO(g.check_out_date), today));
    } else if (statusFilter === "stay-over") {
      const today = new Date();
      result = result.filter(g => !isSameDay(parseISO(g.check_out_date), today));
    } else if (statusFilter === "vip") {
      // Assuming we have a VIP flag or logic. For now, just a placeholder
      // result = result.filter(g => g.guest?.is_vip);
    }

    return result;
  }, [inHouseGuests, searchQuery, statusFilter]);

  const handleRoomMove = async () => {
    if (!selectedRes || !targetRoomId) return;

    try {
      // 1. Update old room status to 'cleaning'
      await supabase.from("rooms").update({ status: "cleaning" }).eq("id", selectedRes.room_id);

      // 2. Update new room status to 'occupied'
      await supabase.from("rooms").update({ status: "occupied" }).eq("id", targetRoomId);

      // 3. Update reservation with new room_id
      await updateReservation.mutateAsync({
        id: selectedRes.id,
        room_id: targetRoomId,
        special_requests: (selectedRes.special_requests ? selectedRes.special_requests + "\n" : "") + `Room Move: from ${selectedRes.room?.room_number} to ${rooms.find(r => r.id === targetRoomId)?.room_number}. Reason: ${moveReason}`
      });

      setIsRoomMoveOpen(false);
      setSelectedRes(null);
      setTargetRoomId("");
      setMoveReason("");
      toast({ title: "Success", description: "Room moved successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to move room: " + error.message, variant: "destructive" });
    }
  };

  const handleExtendStay = async () => {
    if (!selectedRes || !newCheckOutDate) return;

    try {
      await updateReservation.mutateAsync({
        id: selectedRes.id,
        check_out_date: newCheckOutDate
      });
      setIsExtendStayOpen(false);
      setSelectedRes(null);
      setNewCheckOutDate("");
      toast({ title: "Success", description: "Stay extended successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to extend stay: " + error.message, variant: "destructive" });
    }
  };

  const handleQuickPost = async () => {
    if (!selectedRes || !quickPostData.description || quickPostData.amount === 0) return;

    const folio = folios?.find(f => f.reservation_id === selectedRes.id);
    if (!folio) {
      toast({ title: "Error", description: "No folio found for this guest", variant: "destructive" });
      return;
    }

    try {
      await addFolioItem.mutateAsync({
        folio_id: folio.id,
        item_type: 'charge',
        source: quickPostData.source,
        description: quickPostData.description,
        amount: Math.abs(quickPostData.amount)
      });
      setIsQuickPostOpen(false);
      setQuickPostData({ description: "", amount: 0, source: "manual" });
      setSelectedRes(null);
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to post charge: " + error.message, variant: "destructive" });
    }
  };

  const goToFolio = (reservationId: string) => {
    const folio = folios?.find(f => f.reservation_id === reservationId);
    if (folio) {
      setSearchParams(prev => {
        prev.set("tab", "folios");
        prev.set("folioId", folio.id);
        return prev;
      });
    } else {
      toast({ title: "Error", description: "No folio found for this reservation", variant: "destructive" });
    }
  };

  const availableRooms = rooms.filter(r => r.status === 'available');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search in-house guests..."
              className="w-full sm:w-64 pl-9 bg-secondary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger className="w-[160px] bg-secondary">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All In-house</SelectItem>
              <SelectItem value="due-out">Due-out Today</SelectItem>
              <SelectItem value="stay-over">Stay-overs</SelectItem>
              <SelectItem value="vip">VIP Guests</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 py-1.5 px-3">
            <Users className="h-3.5 w-3.5 mr-1.5" />
            {inHouseGuests.length} In-house Guests
          </Badge>
        </div>
      </div>

      <Card variant="elevated">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/30">
                  <TableHead>Guest / Reservation</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Folio Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingRes ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                      <p className="mt-2 text-muted-foreground">Loading guests...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredGuests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                      No in-house guests found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGuests.map((res) => {
                    const folio = folios?.find(f => f.reservation_id === res.id);
                    const isDueOut = isSameDay(parseISO(res.check_out_date), new Date());

                    return (
                      <TableRow key={res.id} className="group">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                              {res.guest?.first_name?.[0]}{res.guest?.last_name?.[0]}
                            </div>
                            <div>
                              <p className="font-medium">{res.guest?.first_name} {res.guest?.last_name}</p>
                              <p className="text-xs text-muted-foreground font-mono">{res.reservation_code}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-bold text-primary">Room {res.room?.room_number}</p>
                              <p className="text-xs text-muted-foreground">{res.room?.room_type}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs">
                              <Badge variant="outline" className="text-[10px] py-0 h-4">IN</Badge>
                              <span>{format(parseISO(res.check_in_date), "MMM dd, yyyy")}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <Badge variant="outline" className={cn("text-[10px] py-0 h-4", isDueOut && "border-warning text-warning")}>OUT</Badge>
                              <span className={cn(isDueOut && "font-bold text-warning")}>{format(parseISO(res.check_out_date), "MMM dd, yyyy")}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {folio ? (
                            <div className="space-y-1">
                              <p className={cn("font-bold", folio.balance > 0 ? "text-destructive" : "text-success")}>
                                {formatCurrency(folio.balance)}
                              </p>
                              <p className="text-[10px] text-muted-foreground">Folio: {folio.folio_number}</p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic text-xs">No folio</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isDueOut ? (
                            <Badge className="bg-warning/20 text-warning border-warning/30 hover:bg-warning/20">Due-out</Badge>
                          ) : (
                            <Badge variant="outline" className="border-success/30 text-success bg-success/10">In-house</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => goToFolio(res.id)}>
                                <Receipt className="h-4 w-4 mr-2" />
                                View Folio
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedRes(res);
                                setIsRoomMoveOpen(true);
                              }}>
                                <ArrowRightLeft className="h-4 w-4 mr-2" />
                                Room Move
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedRes(res);
                                setQuickPostData({ description: "", amount: 0, source: "manual" });
                                setIsQuickPostOpen(true);
                              }}>
                                <CreditCard className="h-4 w-4 mr-2" />
                                Quick Post
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedRes(res);
                                setNewCheckOutDate(res.check_out_date);
                                setIsExtendStayOpen(true);
                              }}>
                                <CalendarPlus className="h-4 w-4 mr-2" />
                                Extend Stay
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-warning">
                                <LogOut className="h-4 w-4 mr-2" />
                                Pre-Check-out
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Room Move Dialog */}
      <Dialog open={isRoomMoveOpen} onOpenChange={setIsRoomMoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Room Move</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">Current Room</p>
                <p className="text-lg font-bold">{selectedRes?.room?.room_number} ({selectedRes?.room?.room_type})</p>
              </div>
              <ArrowRightLeft className="h-6 w-6 text-muted-foreground" />
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase font-bold">New Room</p>
                <p className="text-lg font-bold">{targetRoomId ? rooms.find(r => r.id === targetRoomId)?.room_number : "Select..."}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Select Available Room</Label>
              <Select value={targetRoomId} onValueChange={setTargetRoomId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a room" />
                </SelectTrigger>
                <SelectContent>
                  {availableRooms.map(room => (
                    <SelectItem key={room.id} value={room.id}>
                      Room {room.room_number} - {room.room_type} ({formatCurrency(room.price_per_night)})
                    </SelectItem>
                  ))}
                  {availableRooms.length === 0 && <p className="p-2 text-sm text-center italic">No rooms available</p>}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reason for Move</Label>
              <Input
                placeholder="e.g. AC not working, upgrade, guest preference"
                value={moveReason}
                onChange={(e) => setMoveReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoomMoveOpen(false)}>Cancel</Button>
            <Button onClick={handleRoomMove} disabled={!targetRoomId || !moveReason}>
              Confirm Move
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Post Dialog */}
      <Dialog open={isQuickPostOpen} onOpenChange={setIsQuickPostOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Folio Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Guest</Label>
              <p className="font-bold">{selectedRes?.guest?.first_name} {selectedRes?.guest?.last_name} (Room {selectedRes?.room?.room_number})</p>
            </div>
            <div className="space-y-2">
              <Label>Source</Label>
              <Select
                value={quickPostData.source}
                onValueChange={(v) => setQuickPostData({...quickPostData, source: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual Entry</SelectItem>
                  <SelectItem value="minibar">Mini Bar</SelectItem>
                  <SelectItem value="laundry">Laundry</SelectItem>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="spa">Spa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="e.g. Extra Water Bottle"
                value={quickPostData.description}
                onChange={(e) => setQuickPostData({...quickPostData, description: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={quickPostData.amount}
                onChange={(e) => setQuickPostData({...quickPostData, amount: parseFloat(e.target.value) || 0})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuickPostOpen(false)}>Cancel</Button>
            <Button onClick={handleQuickPost} disabled={!quickPostData.description || quickPostData.amount === 0 || addFolioItem.isPending}>
              {addFolioItem.isPending ? "Posting..." : "Post Charge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Stay Dialog */}
      <Dialog open={isExtendStayOpen} onOpenChange={setIsExtendStayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Stay</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Current Departure Date</Label>
              <p className="text-lg font-bold">{selectedRes ? format(parseISO(selectedRes.check_out_date), "PPP") : ""}</p>
            </div>
            <div className="space-y-2">
              <Label>New Departure Date</Label>
              <Input
                type="date"
                value={newCheckOutDate}
                min={selectedRes?.check_out_date}
                onChange={(e) => setNewCheckOutDate(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground italic">
              Note: Extending stay will increase the total charges in the guest folio based on the room rate.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExtendStayOpen(false)}>Cancel</Button>
            <Button onClick={handleExtendStay} disabled={!newCheckOutDate || newCheckOutDate === selectedRes?.check_out_date}>
              Update Departure
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
