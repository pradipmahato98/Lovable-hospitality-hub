import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserWithRole, useUpdateUserStatus } from "@/hooks/useUsersWithRoles";
import { ShieldAlert, Mail, Calendar, User, UserX, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface UserProfileModalProps {
  user: UserWithRole | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileModal({ user, open, onOpenChange }: UserProfileModalProps) {
  const [blockingReason, setBlockingReason] = useState("");
  const [isBlocking, setIsBlocking] = useState(false);
  const updateUserStatus = useUpdateUserStatus();

  if (!user) return null;

  const handleToggleBlock = () => {
    if (!user.is_blocked && !blockingReason) {
      toast.error("Please provide a reason for blocking this user");
      return;
    }

    updateUserStatus.mutate({
      userId: user.user_id,
      is_blocked: !user.is_blocked,
      blocked_reason: !user.is_blocked ? blockingReason : null,
    }, {
      onSuccess: () => {
        setIsBlocking(false);
        setBlockingReason("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            User Profile Details
          </DialogTitle>
          <DialogDescription>
            Detailed view and administrative controls for {user.first_name || "Unnamed"} {user.last_name || "User"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/20">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-xl bg-primary/20 text-primary">
                {(user.first_name?.[0] || "") + (user.last_name?.[0] || "") || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="font-bold text-lg">
                {user.first_name} {user.last_name}
              </h3>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Mail className="h-3 w-3" /> {user.email}
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="capitalize">{user.role}</Badge>
                {user.is_blocked && (
                  <Badge variant="destructive" className="gap-1">
                    <ShieldAlert className="h-3 w-3" /> Blocked
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">User ID</p>
              <p className="font-mono font-medium">{user.user_id.slice(0, 12)}...</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Joined Date</p>
              <p className="font-medium flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {user.created_at ? format(new Date(user.created_at), "MMM d, yyyy") : "N/A"}
              </p>
            </div>
          </div>

          {user.is_blocked && user.blocked_reason && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
              <p className="font-bold text-destructive flex items-center gap-2 mb-1">
                <ShieldAlert className="h-4 w-4" /> Blocked Reason
              </p>
              <p className="text-muted-foreground italic">"{user.blocked_reason}"</p>
            </div>
          )}

          {!isBlocking ? (
            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                variant={user.is_blocked ? "success" : "destructive"}
                className="gap-2"
                onClick={() => user.is_blocked ? handleToggleBlock() : setIsBlocking(true)}
              >
                {user.is_blocked ? (
                  <><UserCheck className="h-4 w-4" /> Unblock Account</>
                ) : (
                  <><UserX className="h-4 w-4" /> Block Account</>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 pt-4 border-t animate-in fade-in slide-in-from-top-2">
              <div className="space-y-2">
                <Label htmlFor="reason" className="text-destructive font-bold">Reason for Blocking *</Label>
                <Textarea
                  id="reason"
                  placeholder="Mandatory reason for blocking this user..."
                  value={blockingReason}
                  onChange={(e) => setBlockingReason(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsBlocking(false)}>Cancel</Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={!blockingReason || updateUserStatus.isPending}
                  onClick={handleToggleBlock}
                >
                  {updateUserStatus.isPending ? "Processing..." : "Confirm Block"}
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
