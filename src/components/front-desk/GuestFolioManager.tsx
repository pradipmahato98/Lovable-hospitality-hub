import { useState } from "react";
import { useGuestFolios, GuestFolio, FolioItem } from "@/hooks/useGuestFolios";
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
  TableRow
} from "@/components/ui/table";
import {
  Plus,
  Receipt,
  CreditCard,
  History,
  CheckCircle2,
  Printer,
  Download,
  ArrowRight,
  User,
  Home,
  Search,
  MoreVertical,
  Trash2,
  Edit,
  ArrowRightLeft,
  FileText,
  Ban,
  Undo2,
  Shuffle,
  Activity
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import * as XLSX from 'xlsx';

export const GuestFolioManager = () => {
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  const {
    folios,
    isLoading,
    addFolioItem,
    closeFolio,
    voidFolio,
    updateFolioItem,
    deleteFolioItem,
    transferFolioItem,
    createFolio,
    processRefund,
    useRoutingRules,
    addRoutingRule,
    deleteRoutingRule,
    useFolioItems
  } = useGuestFolios();
  const [selectedFolio, setSelectedFolio] = useState<GuestFolio | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Add Item State
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [newItem, setNewItem] = useState<{
    item_type: 'charge' | 'payment' | 'adjustment';
    source: string;
    description: string;
    amount: number;
  }>({
    item_type: 'charge',
    source: 'manual',
    description: '',
    amount: 0
  });

  // Edit Item State
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FolioItem | null>(null);
  const [adjustmentReason, setAdjustmentReason] = useState("");

  // Transfer Item State
  const [isTransferItemOpen, setIsTransferItemOpen] = useState(false);
  const [transferingItem, setTransferingItem] = useState<FolioItem | null>(null);
  const [targetFolioId, setTargetFolioId] = useState("");

  // Void Folio State
  const [isVoidFolioOpen, setIsVoidFolioOpen] = useState(false);

  // Delete Item State
  const [isDeleteItemOpen, setIsDeleteItemOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // Invoice State
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // Payment State
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    method: 'cash',
    amount: 0,
    reference: ''
  });

  // Refund State
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [refundDetails, setRefundDetails] = useState({
    method: 'cash',
    amount: 0,
    reason: ''
  });

  // Routing State
  const [isRoutingOpen, setIsRoutingOpen] = useState(false);
  const [newRoutingRule, setNewRoutingRule] = useState<{
    category: 'room' | 'tax' | 'f&b' | 'incidentals' | 'all';
    target_folio_id: string;
  }>({
    category: 'all',
    target_folio_id: ''
  });

  const { data: items = [] } = useFolioItems(selectedFolio?.id || "");
  const { data: routingRules = [] } = useRoutingRules(selectedFolio?.id || "");

  useEffect(() => {
    if (folios && folios.length > 0 && !selectedFolio) {
      const folioId = searchParams.get('folioId');
      const guestId = searchParams.get('guestId');
      const reservationId = searchParams.get('reservationId');

      if (folioId) {
        const found = folios.find(f => f.id === folioId);
        if (found) setSelectedFolio(found);
      } else if (guestId) {
        const found = folios.find(f => f.guest_id === guestId);
        if (found) setSelectedFolio(found);
      } else if (reservationId) {
        const found = folios.find(f => f.reservation_id === reservationId);
        if (found) setSelectedFolio(found);
      }
    }
  }, [folios, searchParams, selectedFolio]);

  const handleAddItem = async () => {
    if (!selectedFolio) return;

    await addFolioItem.mutateAsync({
      folio_id: selectedFolio.id,
      ...newItem,
      amount: newItem.item_type === 'payment' ? -Math.abs(newItem.amount) : Math.abs(newItem.amount)
    });

    setIsAddItemOpen(false);
    setNewItem({
      item_type: 'charge',
      source: 'manual',
      description: '',
      amount: 0
    });
  };

  const handleUpdateItem = async () => {
    if (!selectedFolio || !editingItem || !adjustmentReason) return;

    await updateFolioItem.mutateAsync({
      ...editingItem,
      folio_id: selectedFolio.id,
      reason: adjustmentReason,
      modified_by: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Staff' : 'Unknown'
    });

    setIsEditItemOpen(false);
    setEditingItem(null);
    setAdjustmentReason("");
  };

  const handleTransferItem = async () => {
    if (!selectedFolio || !transferingItem || !targetFolioId) return;

    await transferFolioItem.mutateAsync({
      itemId: transferingItem.id,
      sourceFolioId: selectedFolio.id,
      targetFolioId: targetFolioId
    });

    setIsTransferItemOpen(false);
    setTransferingItem(null);
    setTargetFolioId("");
  };

  const handleDeleteItem = async () => {
    if (!selectedFolio || !deletingItemId) return;
    await deleteFolioItem.mutateAsync({
      id: deletingItemId,
      folio_id: selectedFolio.id
    });
    setIsDeleteItemOpen(false);
    setDeletingItemId(null);
  };

  const handleVoidFolio = async () => {
    if (!selectedFolio) return;
    await voidFolio.mutateAsync(selectedFolio.id);
    setIsVoidFolioOpen(false);
  };

  const handleProcessPayment = async () => {
    if (!selectedFolio) return;

    await addFolioItem.mutateAsync({
      folio_id: selectedFolio.id,
      item_type: 'payment',
      source: 'manual',
      description: `Payment - ${paymentDetails.method.toUpperCase()} ${paymentDetails.reference ? '(' + paymentDetails.reference + ')' : ''}`,
      amount: -Math.abs(paymentDetails.amount),
      reference_id: paymentDetails.reference
    });

    setIsPaymentOpen(false);
    setPaymentDetails({
      method: 'cash',
      amount: 0,
      reference: ''
    });
  };

  const handleProcessRefund = async () => {
    if (!selectedFolio || !refundDetails.reason) return;

    await processRefund.mutateAsync({
      folio_id: selectedFolio.id,
      amount: refundDetails.amount,
      reason: refundDetails.reason,
      method: refundDetails.method
    });

    setIsRefundOpen(false);
    setRefundDetails({
      method: 'cash',
      amount: 0,
      reason: ''
    });
  };

  const handleCreateSubFolio = async () => {
    if (!selectedFolio) return;

    await createFolio.mutateAsync({
      reservation_id: selectedFolio.reservation_id,
      room_id: selectedFolio.room_id,
      guest_id: selectedFolio.guest_id,
      status: 'open'
    });
  };

  const handleAddRoutingRule = async () => {
    if (!selectedFolio || !newRoutingRule.target_folio_id) return;

    await addRoutingRule.mutateAsync({
      folio_id: selectedFolio.id,
      category: newRoutingRule.category,
      target_folio_id: newRoutingRule.target_folio_id,
      is_active: true
    });

    setNewRoutingRule({ category: 'all', target_folio_id: '' });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (!selectedFolio || !items) return;

    const exportData = items.map(item => ({
      Date: format(new Date(item.created_at), "yyyy-MM-dd HH:mm"),
      Description: item.description,
      Source: item.source,
      Charge: item.amount > 0 ? item.amount : 0,
      Credit: item.amount < 0 ? Math.abs(item.amount) : 0,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Folio Transactions");
    XLSX.writeFile(wb, `Folio_${selectedFolio.folio_number}.xlsx`);
  };

  const filteredFolios = folios?.filter(folio => {
    const searchLower = searchQuery.toLowerCase();
    const guestName = `${folio.guests?.first_name || ''} ${folio.guests?.last_name || ''}`.toLowerCase();
    return (
      folio.folio_number.toLowerCase().includes(searchLower) ||
      guestName.includes(searchLower) ||
      (folio.rooms?.room_number?.toLowerCase().includes(searchLower) ?? false)
    );
  });

  if (isLoading) return <div>Loading folios...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Folio List */}
      <div className="lg:col-span-1 space-y-4">
        <Card variant="elevated">
          <CardHeader className="space-y-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Active Folios
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search folios..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
              {filteredFolios?.map((folio) => (
                <div
                  key={folio.id}
                  className={cn(
                    "p-4 cursor-pointer hover:bg-secondary/50 transition-colors",
                    selectedFolio?.id === folio.id && "bg-secondary border-l-4 border-primary"
                  )}
                  onClick={() => setSelectedFolio(folio)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-sm font-bold text-primary">{folio.folio_number}</span>
                    <Badge variant={folio.status === 'open' ? 'outline' : 'default'} className={folio.status === 'open' ? 'border-success text-success' : ''}>
                      {folio.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{folio.guests?.first_name} {folio.guests?.last_name}</span>
                    <Link to="/guests" className="ml-auto text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Home className="h-4 w-4" />
                    <span>Room {folio.rooms?.room_number} ({folio.rooms?.room_type})</span>
                    <Link to="/front-desk" className="ml-auto text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-border/50">
                    <span>Balance:</span>
                    <span className={cn("font-bold", folio.balance > 0 ? "text-destructive" : "text-success")}>
                      ${folio.balance.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
              {folios?.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  No active folios found.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Folio Detail */}
      <div className="lg:col-span-2">
        {selectedFolio ? (
          <div className="space-y-6 animate-fade-in">
            <Card variant="elevated">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-display">{selectedFolio.folio_number}</CardTitle>
                  <p className="text-muted-foreground">Guest: {selectedFolio.guests?.first_name} {selectedFolio.guests?.last_name}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-secondary/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Charges</p>
                    <p className="text-xl font-bold font-display">${selectedFolio.total_charges.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-secondary/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Payments</p>
                    <p className="text-xl font-bold font-display text-success">${selectedFolio.total_payments.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                    <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                    <p className={cn("text-xl font-bold font-display", selectedFolio.balance > 0 ? "text-destructive" : "text-success")}>
                      ${selectedFolio.balance.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <Tabs defaultValue="transactions" className="w-full">
                    <div className="flex justify-between items-center mb-4">
                      <TabsList>
                        <TabsTrigger value="transactions" className="gap-2">
                          <Receipt className="h-4 w-4" />
                          Transactions
                        </TabsTrigger>
                        <TabsTrigger value="activity" className="gap-2">
                          <Activity className="h-4 w-4" />
                          Activity Log
                        </TabsTrigger>
                      </TabsList>
                      <div className="flex gap-2">
                    <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="gap-2">
                          <Plus className="h-4 w-4" />
                          Add Item
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Folio Item</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Item Type</Label>
                            <Select
                              value={newItem.item_type}
                              onValueChange={(v: 'charge' | 'payment' | 'adjustment') => setNewItem({...newItem, item_type: v})}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="charge">Charge</SelectItem>
                                <SelectItem value="payment">Payment</SelectItem>
                                <SelectItem value="adjustment">Adjustment</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Source</Label>
                            <Select
                              value={newItem.source}
                              onValueChange={(v) => setNewItem({...newItem, source: v})}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select source" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="manual">Manual Entry</SelectItem>
                                <SelectItem value="laundry">Laundry</SelectItem>
                                <SelectItem value="minibar">Mini Bar</SelectItem>
                                <SelectItem value="restaurant">Restaurant</SelectItem>
                                <SelectItem value="spa">Spa</SelectItem>
                                <SelectItem value="other">Other Service</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                              placeholder="e.g. Extra Bed, Cash Deposit"
                              value={newItem.description}
                              onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Amount</Label>
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={newItem.amount}
                              onChange={(e) => setNewItem({...newItem, amount: parseFloat(e.target.value) || 0})}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAddItemOpen(false)}>Cancel</Button>
                          <Button onClick={handleAddItem} disabled={addFolioItem.isPending}>
                            {addFolioItem.isPending ? "Adding..." : "Add to Folio"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-2"
                      onClick={() => setIsVoidFolioOpen(true)}
                      disabled={selectedFolio.status !== 'open'}
                    >
                      <Ban className="h-4 w-4" />
                      Void Folio
                    </Button>
                        <Button
                          variant="gold"
                          size="sm"
                          className="gap-2"
                          onClick={() => closeFolio.mutate(selectedFolio.id)}
                          disabled={selectedFolio.status !== 'open'}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Settle & Close
                        </Button>
                      </div>
                    </div>

                    <TabsContent value="transactions" className="m-0">
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                      <TableRow className="bg-secondary/30">
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead className="text-right">Charge</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(item.created_at), "MMM dd, HH:mm")}
                          </TableCell>
                          <TableCell className="font-medium">{item.description}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize text-[10px]">{item.source}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {item.amount > 0 ? `$${item.amount.toFixed(2)}` : "-"}
                          </TableCell>
                          <TableCell className="text-right font-mono text-success">
                            {item.amount < 0 ? `$${Math.abs(item.amount).toFixed(2)}` : "-"}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setEditingItem(item);
                                  setIsEditItemOpen(true);
                                }}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setTransferingItem(item);
                                  setIsTransferItemOpen(true);
                                }}>
                                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                                  Transfer
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    setDeletingItemId(item.id);
                                    setIsDeleteItemOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                      {items.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No transactions recorded for this folio.
                          </TableCell>
                        </TableRow>
                      )}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>

                    <TabsContent value="activity" className="m-0">
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-secondary/30">
                              <TableHead>Time</TableHead>
                              <TableHead>Action</TableHead>
                              <TableHead>Reason / Details</TableHead>
                              <TableHead>User</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {items.filter(i => i.reason).map((item) => (
                              <TableRow key={`audit-${item.id}`}>
                                <TableCell className="text-xs text-muted-foreground">
                                  {format(new Date(item.created_at), "MMM dd, HH:mm:ss")}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-[10px]">ADJUSTMENT</Badge>
                                </TableCell>
                                <TableCell className="text-sm">
                                  <span className="font-medium">{item.description}</span>
                                  <p className="text-xs text-muted-foreground mt-1">Reason: {item.reason}</p>
                                </TableCell>
                                <TableCell className="text-xs font-medium">{item.modified_by || 'System'}</TableCell>
                              </TableRow>
                            ))}
                            {items.filter(i => i.reason).length === 0 && (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground italic">
                                  No modification activity recorded for this folio.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card
                variant="glass"
                className="p-4 flex items-center gap-4 group cursor-pointer hover:bg-primary/5 transition-colors"
                onClick={() => setIsInvoiceOpen(true)}
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Receipt className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-semibold">Issue Tax Invoice</h4>
                  <p className="text-sm text-muted-foreground">Generate official VAT receipt for this guest.</p>
                </div>
                <ArrowRight className="h-5 w-5 ml-auto text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </Card>
              <Card
                variant="glass"
                className="p-4 flex items-center gap-4 group cursor-pointer hover:bg-success/5 transition-colors"
                onClick={() => {
                  setPaymentDetails({ ...paymentDetails, amount: selectedFolio.balance });
                  setIsPaymentOpen(true);
                }}
              >
                <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center text-success group-hover:scale-110 transition-transform">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-semibold">Process Payment</h4>
                  <p className="text-sm text-muted-foreground">Swipe card or record bank transfer payment.</p>
                </div>
                <ArrowRight className="h-5 w-5 ml-auto text-muted-foreground group-hover:text-success group-hover:translate-x-1 transition-all" />
              </Card>
              <Card
                variant="glass"
                className="p-4 flex items-center gap-4 group cursor-pointer hover:bg-gold/5 transition-colors"
                onClick={handleCreateSubFolio}
              >
                <div className="h-12 w-12 rounded-full bg-gold/10 flex items-center justify-center text-gold group-hover:scale-110 transition-transform">
                  <ArrowRightLeft className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-semibold">Split Folio</h4>
                  <p className="text-sm text-muted-foreground">Create a second folio for this stay to split charges.</p>
                </div>
                <ArrowRight className="h-5 w-5 ml-auto text-muted-foreground group-hover:text-gold group-hover:translate-x-1 transition-all" />
              </Card>
              <Card
                variant="glass"
                className="p-4 flex items-center gap-4 group cursor-pointer hover:bg-destructive/5 transition-colors"
                onClick={() => setIsRefundOpen(true)}
              >
                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive group-hover:scale-110 transition-transform">
                  <Undo2 className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-semibold">Process Refund</h4>
                  <p className="text-sm text-muted-foreground">Issue a refund for overpayment or cancelled services.</p>
                </div>
                <ArrowRight className="h-5 w-5 ml-auto text-muted-foreground group-hover:text-destructive group-hover:translate-x-1 transition-all" />
              </Card>
              <Card
                variant="glass"
                className="p-4 flex items-center gap-4 group cursor-pointer hover:bg-primary/5 transition-colors"
                onClick={() => setIsRoutingOpen(true)}
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Shuffle className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-semibold">Routing Instructions</h4>
                  <p className="text-sm text-muted-foreground">Set automated rules for charge distribution.</p>
                </div>
                <ArrowRight className="h-5 w-5 ml-auto text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </Card>
            </div>
          </div>
        ) : (
          <Card className="h-[400px] flex items-center justify-center text-muted-foreground border-dashed">
            <div className="text-center">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Select a folio from the list to view details and manage transactions.</p>
            </div>
          </Card>
        )}
      </div>

      {/* Edit Item Dialog */}
      <Dialog open={isEditItemOpen} onOpenChange={setIsEditItemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Folio Item</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={editingItem.amount}
                  onChange={(e) => setEditingItem({...editingItem, amount: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <Label>Reason for Adjustment *</Label>
                <Input
                  placeholder="e.g. Billing error, discount applied"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className={cn(!adjustmentReason && "border-destructive")}
                />
                {!adjustmentReason && <p className="text-[10px] text-destructive">A reason is required for auditing.</p>}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditItemOpen(false)}>Cancel</Button>
            <Button
              onClick={handleUpdateItem}
              disabled={updateFolioItem.isPending || !adjustmentReason}
            >
              {updateFolioItem.isPending ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Item Dialog */}
      <Dialog open={isTransferItemOpen} onOpenChange={setIsTransferItemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Folio Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Select the target folio to transfer "{transferingItem?.description}" to.
            </p>
            <div className="space-y-2">
              <Label>Target Folio</Label>
              <Select value={targetFolioId} onValueChange={setTargetFolioId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target folio" />
                </SelectTrigger>
                <SelectContent>
                  {folios?.filter(f => f.id !== selectedFolio?.id && f.status === 'open').map(folio => (
                    <SelectItem key={folio.id} value={folio.id}>
                      {folio.folio_number} - {folio.guests?.first_name} {folio.guests?.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTransferItemOpen(false)}>Cancel</Button>
            <Button onClick={handleTransferItem} disabled={transferFolioItem.isPending || !targetFolioId}>
              {transferFolioItem.isPending ? "Transferring..." : "Transfer Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Void Folio Alert */}
      <AlertDialog open={isVoidFolioOpen} onOpenChange={setIsVoidFolioOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will void the entire folio. This action cannot be undone and will
              mark all transactions as voided in the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleVoidFolio} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Void Folio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Item Alert */}
      <AlertDialog open={isDeleteItemOpen} onOpenChange={setIsDeleteItemOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folio Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingItemId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invoice Dialog */}
      <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tax Invoice Preview</DialogTitle>
          </DialogHeader>
          {selectedFolio && (
            <div id="tax-invoice" className="p-8 border bg-white text-black space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-bold uppercase tracking-tight">Tax Invoice</h2>
                  <p className="text-muted-foreground mt-1">LuxeStay ERP - Hospitality Excellence</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">Folio #: {selectedFolio.folio_number}</p>
                  <p>Date: {format(new Date(), "PPP")}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 py-6 border-t border-b">
                <div>
                  <h3 className="font-bold mb-2 uppercase text-xs text-muted-foreground">Guest Details</h3>
                  <p className="font-medium text-lg">{selectedFolio.guests?.first_name} {selectedFolio.guests?.last_name}</p>
                  <p>{selectedFolio.guests?.email}</p>
                </div>
                <div>
                  <h3 className="font-bold mb-2 uppercase text-xs text-muted-foreground">Stay Information</h3>
                  <p>Room: <span className="font-medium">{selectedFolio.rooms?.room_number}</span></p>
                  <p>Type: {selectedFolio.rooms?.room_type}</p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-black">Date</TableHead>
                    <TableHead className="text-black">Description</TableHead>
                    <TableHead className="text-right text-black">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id} className="border-none">
                      <TableCell className="py-2">{format(new Date(item.created_at), "MMM dd, yyyy")}</TableCell>
                      <TableCell className="py-2">{item.description}</TableCell>
                      <TableCell className="text-right py-2 font-mono">${item.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex flex-col items-end pt-6 border-t space-y-2">
                <div className="flex justify-between w-48">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-mono">${selectedFolio.total_charges.toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-48">
                  <span className="text-muted-foreground">Tax (0%):</span>
                  <span className="font-mono">$0.00</span>
                </div>
                <div className="flex justify-between w-48 border-t pt-2 mt-2">
                  <span className="font-bold">Total:</span>
                  <span className="font-bold font-mono text-lg">${selectedFolio.total_charges.toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-48 text-success font-medium">
                  <span>Paid:</span>
                  <span className="font-mono">-${selectedFolio.total_payments.toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-48 border-t-2 border-double pt-2 mt-2 font-bold text-xl">
                  <span>Balance:</span>
                  <span className="font-mono">${selectedFolio.balance.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-12 text-center text-xs text-muted-foreground">
                <p>Thank you for choosing LuxeStay. This is a computer generated document.</p>
                <p>Tax ID: GST-99228811 | LuxeStay ERP - Proprietary System</p>
              </div>
            </div>
          )}
          <DialogFooter className="print:hidden">
            <Button variant="outline" onClick={() => setIsInvoiceOpen(false)}>Close</Button>
            <Button onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />
              Print Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Process Refund Dialog */}
      <Dialog open={isRefundOpen} onOpenChange={setIsRefundOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Refund Method</Label>
              <Select
                value={refundDetails.method}
                onValueChange={(v) => setRefundDetails({...refundDetails, method: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit_card">Original Credit Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Account</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Refund Amount</Label>
              <Input
                type="number"
                value={refundDetails.amount}
                onChange={(e) => setRefundDetails({...refundDetails, amount: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div className="space-y-2">
              <Label>Reason for Refund *</Label>
              <Input
                placeholder="e.g. Guest overpaid, cancellation"
                value={refundDetails.reason}
                onChange={(e) => setRefundDetails({...refundDetails, reason: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRefundOpen(false)}>Cancel</Button>
            <Button
              onClick={handleProcessRefund}
              disabled={processRefund.isPending || !refundDetails.reason || refundDetails.amount <= 0}
              variant="destructive"
            >
              {processRefund.isPending ? "Processing..." : "Confirm Refund"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Routing Instructions Dialog */}
      <Dialog open={isRoutingOpen} onOpenChange={setIsRoutingOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Folio Routing Instructions</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Active Rules</h4>
              <div className="space-y-2">
                {routingRules.map((rule) => {
                  const targetFolio = folios?.find(f => f.id === rule.target_folio_id);
                  return (
                    <div key={rule.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border">
                      <div>
                        <p className="font-medium capitalize">{rule.category} Charges</p>
                        <p className="text-xs text-muted-foreground">Route to: {targetFolio?.folio_number || 'Unknown Folio'}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive h-8 w-8 p-0"
                        onClick={() => deleteRoutingRule.mutate({ id: rule.id, folioId: selectedFolio.id })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
                {routingRules.length === 0 && (
                  <p className="text-sm text-muted-foreground italic text-center py-4 border border-dashed rounded-lg">
                    No active routing rules.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-medium">Add New Rule</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={newRoutingRule.category}
                    onValueChange={(v: 'room' | 'tax' | 'f&b' | 'incidentals' | 'all') => setNewRoutingRule({...newRoutingRule, category: v})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Items</SelectItem>
                      <SelectItem value="room">Room & Tax</SelectItem>
                      <SelectItem value="f&b">Food & Beverage</SelectItem>
                      <SelectItem value="incidentals">Incidentals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target Folio</Label>
                  <Select
                    value={newRoutingRule.target_folio_id}
                    onValueChange={(v) => setNewRoutingRule({...newRoutingRule, target_folio_id: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select folio" />
                    </SelectTrigger>
                    <SelectContent>
                      {folios?.filter(f => f.id !== selectedFolio?.id).map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.folio_number}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                className="w-full gap-2"
                onClick={handleAddRoutingRule}
                disabled={!newRoutingRule.target_folio_id || addRoutingRule.isPending}
              >
                <Plus className="h-4 w-4" />
                Add Routing Rule
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoutingOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Process Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select
                value={paymentDetails.method}
                onValueChange={(v) => setPaymentDetails({...paymentDetails, method: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="upi">UPI / QR Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                value={paymentDetails.amount}
                onChange={(e) => setPaymentDetails({...paymentDetails, amount: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div className="space-y-2">
              <Label>Reference (Optional)</Label>
              <Input
                placeholder="Transaction ID, Check #, etc."
                value={paymentDetails.reference}
                onChange={(e) => setPaymentDetails({...paymentDetails, reference: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>Cancel</Button>
            <Button onClick={handleProcessPayment} disabled={addFolioItem.isPending}>
              {addFolioItem.isPending ? "Processing..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
