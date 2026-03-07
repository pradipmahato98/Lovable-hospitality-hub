import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface LocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location?: any | null;
  onSave: (data: any) => Promise<void>;
}

export const LocationDialog = ({
  open,
  onOpenChange,
  location,
  onSave,
}: LocationDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name || "",
        description: location.description || "",
      });
    } else {
      setFormData({ name: "", description: "" });
    }
  }, [location, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{location ? "Edit Location" : "Add Storage Location"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="loc-name">Location Name *</Label>
            <Input
              id="loc-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Main Kitchen, Basement Cold Room"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="loc-desc">Description</Label>
            <Textarea
              id="loc-desc"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of what's stored here"
            />
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold">
              {location ? "Update Location" : "Create Location"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
