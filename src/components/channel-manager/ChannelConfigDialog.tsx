import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OTAChannel } from "@/hooks/useChannelManager";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Plus, X } from "lucide-react";

const channelSchema = zod.object({
  name: zod.string().min(2, "Name must be at least 2 characters"),
  code: zod.string().min(2, "Code must be at least 2 characters"),
  api_endpoint: zod.string().url("Must be a valid URL").optional().or(zod.literal("")),
  commission_rate: zod.coerce.number().min(0).max(100),
  settings: zod.record(zod.any()).default({}),
});

type ChannelFormValues = zod.infer<typeof channelSchema>;

interface ChannelConfigDialogProps {
  channel?: OTAChannel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: ChannelFormValues) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export const ChannelConfigDialog = ({
  channel,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: ChannelConfigDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customSettings, setCustomSettings] = useState<{ key: string; value: string }[]>([]);

  const form = useForm<ChannelFormValues>({
    resolver: zodResolver(channelSchema),
    defaultValues: {
      name: "",
      code: "",
      api_endpoint: "",
      commission_rate: 0,
      settings: {},
    },
  });

  useEffect(() => {
    if (channel) {
      form.reset({
        name: channel.name,
        code: channel.code,
        api_endpoint: channel.api_endpoint || "",
        commission_rate: channel.commission_rate,
        settings: channel.settings || {},
      });

      const settingsArray = Object.entries(channel.settings || {}).map(([key, value]) => ({
        key,
        value: typeof value === "string" ? value : JSON.stringify(value),
      }));
      setCustomSettings(settingsArray);
    } else {
      form.reset({
        name: "",
        code: "",
        api_endpoint: "",
        commission_rate: 0,
        settings: {},
      });
      setCustomSettings([]);
    }
  }, [channel, form, open]);

  const onSubmit = async (values: ChannelFormValues) => {
    setIsSubmitting(true);
    try {
      const settingsObj: Record<string, any> = {};
      customSettings.forEach((s) => {
        if (s.key) settingsObj[s.key] = s.value;
      });

      await onSave({ ...values, settings: settingsObj });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSetting = () => {
    setCustomSettings([...customSettings, { key: "", value: "" }]);
  };

  const removeSetting = (index: number) => {
    setCustomSettings(customSettings.filter((_, i) => i !== index));
  };

  const updateSetting = (index: number, field: "key" | "value", value: string) => {
    const newSettings = [...customSettings];
    newSettings[index][field] = value;
    setCustomSettings(newSettings);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{channel ? "Configure Channel" : "Add New Channel"}</DialogTitle>
          <DialogDescription>
            {channel
              ? `Manage settings for ${channel.name}`
              : "Enter the details for the new OTA connection"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Channel Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Booking.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. BCOM" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="commission_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commission (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="api_endpoint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Endpoint URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://api.example.com/v1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Advanced Settings</Label>
                <Button type="button" variant="outline" size="sm" onClick={addSetting}>
                  <Plus className="h-3 w-3 mr-1" /> Add Field
                </Button>
              </div>

              <div className="space-y-2">
                {customSettings.map((setting, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <Input
                      placeholder="Key (e.g. API_KEY)"
                      value={setting.key}
                      onChange={(e) => updateSetting(index, "key", e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Value"
                      value={setting.value}
                      onChange={(e) => updateSetting(index, "value", e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSetting(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {customSettings.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No custom settings added.</p>
                )}
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between sm:justify-between gap-2 pt-4">
              {channel && onDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the channel connection for {channel.name}.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(channel.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <div className="flex gap-2 ml-auto">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : channel ? "Save Changes" : "Add Channel"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
