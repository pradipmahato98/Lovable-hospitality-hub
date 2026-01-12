import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  User,
  Building2,
  MapPin,
  CreditCard,
  Wallet,
  Banknote,
  Building,
  Plus,
  Search,
  Hash,
  Receipt,
} from "lucide-react";
import { usePOSCompanies, POSCompany } from "@/hooks/usePOS";
import { AddCompanyDialog } from "./AddCompanyDialog";
import { cn } from "@/lib/utils";

export interface BillingDetailsData {
  customerName: string;
  customerAddress: string;
  companyId: string | null;
  companyName: string;
  vatNumber: string;
  panNumber: string;
  paymentMethod: string;
  rrnNumber: string;
  transactionRef: string;
  cardLastFour: string;
  cardType: string;
  roomNumber: string;
}

interface BillingDetailsProps {
  data: BillingDetailsData;
  onChange: (data: BillingDetailsData) => void;
  occupiedRooms: { id: string; room_number: string; room_type: string }[];
}

export function BillingDetails({ data, onChange, occupiedRooms }: BillingDetailsProps) {
  const [companySearch, setCompanySearch] = useState("");
  const [vatPanSearch, setVatPanSearch] = useState("");
  const [companyPopoverOpen, setCompanyPopoverOpen] = useState(false);
  const [vatPanPopoverOpen, setVatPanPopoverOpen] = useState(false);
  const [addCompanyDialogOpen, setAddCompanyDialogOpen] = useState(false);
  const [initialVatPan, setInitialVatPan] = useState("");

  const { data: companies = [] } = usePOSCompanies(companySearch || vatPanSearch);

  const handleCompanySelect = (company: POSCompany) => {
    onChange({
      ...data,
      companyId: company.id,
      companyName: company.name,
      vatNumber: company.vat_number || "",
      panNumber: company.pan_number || "",
    });
    setCompanyPopoverOpen(false);
    setVatPanPopoverOpen(false);
  };

  const handleAddCompany = (company: { id: string; name: string; vat_number: string | null; pan_number: string | null }) => {
    onChange({
      ...data,
      companyId: company.id,
      companyName: company.name,
      vatNumber: company.vat_number || "",
      panNumber: company.pan_number || "",
    });
  };

  const openAddCompanyWithVatPan = () => {
    setInitialVatPan(vatPanSearch);
    setAddCompanyDialogOpen(true);
    setVatPanPopoverOpen(false);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Customer Details */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <User className="h-4 w-4" />
            Customer Details
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="customer-name" className="text-xs">Name</Label>
              <Input
                id="customer-name"
                placeholder="Customer name"
                value={data.customerName}
                onChange={(e) => onChange({ ...data, customerName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customer-address" className="text-xs">Address</Label>
              <Input
                id="customer-address"
                placeholder="Customer address"
                value={data.customerAddress}
                onChange={(e) => onChange({ ...data, customerAddress: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Company Details */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Company Details
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Company Name with Autocomplete */}
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                Company Name
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => setAddCompanyDialogOpen(true)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </Label>
              <Popover open={companyPopoverOpen} onOpenChange={setCompanyPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between font-normal",
                      !data.companyName && "text-muted-foreground"
                    )}
                  >
                    {data.companyName || "Search company..."}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search company..."
                      value={companySearch}
                      onValueChange={setCompanySearch}
                    />
                    <CommandList>
                      <CommandEmpty>
                        <div className="py-2 text-center">
                          <p className="text-sm text-muted-foreground">No company found</p>
                          <Button
                            variant="link"
                            size="sm"
                            className="mt-1"
                            onClick={() => {
                              setAddCompanyDialogOpen(true);
                              setCompanyPopoverOpen(false);
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add new company
                          </Button>
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        {companies.map((company) => (
                          <CommandItem
                            key={company.id}
                            value={company.name}
                            onSelect={() => handleCompanySelect(company)}
                          >
                            <Building className="mr-2 h-4 w-4" />
                            <div className="flex-1">
                              <p className="font-medium">{company.name}</p>
                              {company.vat_number && (
                                <p className="text-xs text-muted-foreground">
                                  VAT: {company.vat_number}
                                </p>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* VAT/PAN Search */}
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                VAT/PAN Number
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={openAddCompanyWithVatPan}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </Label>
              <Popover open={vatPanPopoverOpen} onOpenChange={setVatPanPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between font-normal",
                      !data.vatNumber && !data.panNumber && "text-muted-foreground"
                    )}
                  >
                    {data.vatNumber || data.panNumber || "Search by VAT/PAN..."}
                    <Hash className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Enter VAT or PAN number..."
                      value={vatPanSearch}
                      onValueChange={setVatPanSearch}
                    />
                    <CommandList>
                      <CommandEmpty>
                        <div className="py-2 text-center">
                          <p className="text-sm text-muted-foreground">No match found</p>
                          <Button
                            variant="link"
                            size="sm"
                            className="mt-1"
                            onClick={openAddCompanyWithVatPan}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add new company
                          </Button>
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        {companies.map((company) => (
                          <CommandItem
                            key={company.id}
                            value={company.vat_number || company.pan_number || ""}
                            onSelect={() => handleCompanySelect(company)}
                          >
                            <Hash className="mr-2 h-4 w-4" />
                            <div className="flex-1">
                              <p className="font-medium">{company.name}</p>
                              <div className="text-xs text-muted-foreground">
                                {company.vat_number && <span>VAT: {company.vat_number}</span>}
                                {company.vat_number && company.pan_number && " | "}
                                {company.pan_number && <span>PAN: {company.pan_number}</span>}
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Payment Method
          </h4>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: "cash", label: "Cash", icon: Banknote },
              { id: "card", label: "Card", icon: CreditCard },
              { id: "wallet", label: "Digital Wallet", icon: Wallet },
              { id: "room", label: "Room Charge", icon: Building },
            ].map((method) => {
              const Icon = method.icon;
              return (
                <Button
                  key={method.id}
                  type="button"
                  variant={data.paymentMethod === method.id ? "secondary" : "outline"}
                  className="gap-2 h-auto py-3 flex-col"
                  onClick={() => onChange({ ...data, paymentMethod: method.id })}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{method.label}</span>
                </Button>
              );
            })}
          </div>

          {/* Payment Method Specific Fields */}
          {data.paymentMethod === "wallet" && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-secondary/30 rounded-lg">
              <div className="space-y-1.5">
                <Label className="text-xs">RRN Number</Label>
                <Input
                  placeholder="Enter RRN"
                  value={data.rrnNumber}
                  onChange={(e) => onChange({ ...data, rrnNumber: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Transaction ID</Label>
                <Input
                  placeholder="Transaction ID"
                  value={data.transactionRef}
                  onChange={(e) => onChange({ ...data, transactionRef: e.target.value })}
                />
              </div>
            </div>
          )}

          {data.paymentMethod === "card" && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-secondary/30 rounded-lg">
              <div className="space-y-1.5">
                <Label className="text-xs">Card Type</Label>
                <Select
                  value={data.cardType}
                  onValueChange={(value) => onChange({ ...data, cardType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select card type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visa">Visa</SelectItem>
                    <SelectItem value="mastercard">Mastercard</SelectItem>
                    <SelectItem value="amex">American Express</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Last 4 Digits</Label>
                <Input
                  placeholder="XXXX"
                  maxLength={4}
                  value={data.cardLastFour}
                  onChange={(e) => onChange({ ...data, cardLastFour: e.target.value.replace(/\D/g, "") })}
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Transaction Reference</Label>
                <Input
                  placeholder="Transaction reference"
                  value={data.transactionRef}
                  onChange={(e) => onChange({ ...data, transactionRef: e.target.value })}
                />
              </div>
            </div>
          )}

          {data.paymentMethod === "room" && (
            <div className="p-3 bg-secondary/30 rounded-lg">
              <div className="space-y-1.5">
                <Label className="text-xs">Select Room</Label>
                <Select
                  value={data.roomNumber}
                  onValueChange={(value) => onChange({ ...data, roomNumber: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select occupied room" />
                  </SelectTrigger>
                  <SelectContent>
                    {occupiedRooms.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No occupied rooms
                      </SelectItem>
                    ) : (
                      occupiedRooms.map((room) => (
                        <SelectItem key={room.id} value={room.room_number}>
                          Room {room.room_number} ({room.room_type})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </div>

      <AddCompanyDialog
        open={addCompanyDialogOpen}
        onOpenChange={setAddCompanyDialogOpen}
        onCompanyAdded={handleAddCompany}
        initialVatPan={initialVatPan}
      />
    </>
  );
}
