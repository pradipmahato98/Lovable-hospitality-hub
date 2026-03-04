import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface NewGuestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface GuestFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  is_vip: boolean;
  company: string;
  id_type: string;
  id_number: string;
}

const initialFormData: GuestFormData = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  is_vip: false,
  company: "",
  id_type: "",
  id_number: "",
};

export function NewGuestDialog({ open, onOpenChange, onSuccess }: NewGuestDialogProps) {
  const [formData, setFormData] = useState<GuestFormData>(initialFormData);
  const queryClient = useQueryClient();

  const createGuestMutation = useMutation({
    mutationFn: async (data: GuestFormData) => {
      const { data: guest, error } = await supabase
        .from("guests")
        .insert({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email || null,
          phone: data.phone || null,
          is_vip: data.is_vip,
          company: data.company || null,
          id_type: data.id_type || null,
          id_number: data.id_number || null,
        })
        .select()
        .single();

      if (error) throw error;
      return guest;
    },
    onSuccess: () => {
      toast.success("Guest created successfully");
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      onOpenChange(false);
      setFormData(initialFormData);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Failed to create guest: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name) {
      toast.error("First name and last name are required");
      return;
    }
    createGuestMutation.mutate(formData);
  };

  const handleClose = () => {
    setFormData(initialFormData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New Guest / Company Profile</DialogTitle>
            <DialogDescription>
              Create a new profile. Press Ctrl+G to open this dialog anywhere.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  placeholder="John"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  placeholder="Doe"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company / Organization</Label>
              <Input
                id="company"
                placeholder="Company Name"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="id_type">ID Type</Label>
                <Input
                  id="id_type"
                  placeholder="Passport/VAT"
                  value={formData.id_type}
                  onChange={(e) =>
                    setFormData({ ...formData, id_type: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="id_number">ID Number</Label>
                <Input
                  id="id_number"
                  placeholder="Number"
                  value={formData.id_number}
                  onChange={(e) =>
                    setFormData({ ...formData, id_number: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_vip"
                checked={formData.is_vip}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_vip: checked as boolean })
                }
              />
              <Label htmlFor="is_vip" className="cursor-pointer text-sm font-medium">
                Mark as VIP Profile
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createGuestMutation.isPending}>
              {createGuestMutation.isPending ? "Creating..." : "Create Guest"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
