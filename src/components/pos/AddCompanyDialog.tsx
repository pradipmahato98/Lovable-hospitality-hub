import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreatePOSCompany } from "@/hooks/usePOS";
import { Building2, Loader2 } from "lucide-react";

interface AddCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompanyAdded?: (company: { id: string; name: string; vat_number: string | null; pan_number: string | null }) => void;
  initialVatPan?: string;
}

export function AddCompanyDialog({ open, onOpenChange, onCompanyAdded, initialVatPan }: AddCompanyDialogProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [vatNumber, setVatNumber] = useState(initialVatPan || "");
  const [panNumber, setPanNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const createCompany = useCreatePOSCompany();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    try {
      const result = await createCompany.mutateAsync({
        name: name.trim(),
        address: address.trim() || null,
        vat_number: vatNumber.trim() || null,
        pan_number: panNumber.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
      });

      onCompanyAdded?.({
        id: result.id,
        name: result.name,
        vat_number: result.vat_number,
        pan_number: result.pan_number,
      });

      // Reset form
      setName("");
      setAddress("");
      setVatNumber("");
      setPanNumber("");
      setPhone("");
      setEmail("");
      onOpenChange(false);
    } catch {
      // Error handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Add New Company
          </DialogTitle>
          <DialogDescription>
            Add a new company for billing purposes
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name *</Label>
            <Input
              id="company-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter company name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-address">Address</Label>
            <Input
              id="company-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter company address"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vat-number">VAT Number</Label>
              <Input
                id="vat-number"
                value={vatNumber}
                onChange={(e) => setVatNumber(e.target.value)}
                placeholder="VAT number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pan-number">PAN Number</Label>
              <Input
                id="pan-number"
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value)}
                placeholder="PAN number"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-phone">Phone</Label>
              <Input
                id="company-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-email">Email</Label>
              <Input
                id="company-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="blue" disabled={createCompany.isPending || !name.trim()}>
              {createCompany.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Company
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
