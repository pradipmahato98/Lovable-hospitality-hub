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
  Home
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
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export const GuestFolioManager = () => {
  const { folios, isLoading, addFolioItem, closeFolio, useFolioItems } = useGuestFolios();
  const [selectedFolio, setSelectedFolio] = useState<GuestFolio | null>(null);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    item_type: 'charge' as const,
    source: 'manual',
    description: '',
    amount: 0
  });

  const { data: items = [] } = useFolioItems(selectedFolio?.id || "");

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

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) return <div>Loading folios...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Folio List */}
      <div className="lg:col-span-1 space-y-4">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Active Folios
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {folios?.map((folio) => (
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
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Home className="h-4 w-4" />
                    <span>Room {folio.rooms?.room_number} ({folio.rooms?.room_type})</span>
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
                  <Button variant="outline" size="sm">
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
                  <h3 className="font-semibold text-lg">Transaction History</h3>
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
                              onValueChange={(v: "room_charge" | "payment" | "adjustment" | "service") => setNewItem({...newItem, item_type: v})}
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

                    <Button variant="gold" size="sm" className="gap-2" onClick={() => closeFolio.mutate(selectedFolio.id)} disabled={selectedFolio.status === 'closed'}>
                      <CheckCircle2 className="h-4 w-4" />
                      Settle & Close
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/30">
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead className="text-right">Charge</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
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
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card variant="glass" className="p-4 flex items-center gap-4 group cursor-pointer hover:bg-primary/5 transition-colors">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Receipt className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-semibold">Issue Tax Invoice</h4>
                  <p className="text-sm text-muted-foreground">Generate official VAT receipt for this guest.</p>
                </div>
                <ArrowRight className="h-5 w-5 ml-auto text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </Card>
              <Card variant="glass" className="p-4 flex items-center gap-4 group cursor-pointer hover:bg-success/5 transition-colors">
                <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center text-success group-hover:scale-110 transition-transform">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-semibold">Process Payment</h4>
                  <p className="text-sm text-muted-foreground">Swipe card or record bank transfer payment.</p>
                </div>
                <ArrowRight className="h-5 w-5 ml-auto text-muted-foreground group-hover:text-success group-hover:translate-x-1 transition-all" />
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
    </div>
  );
};
