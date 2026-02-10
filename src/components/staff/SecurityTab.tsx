import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Lock, Smartphone, Eye, EyeOff, Check, X, QrCode, Monitor, Laptop } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { trackActivity } from "@/utils/auditLogger";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const SecurityTab = () => {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: ""
  });
  const [loading, setLoading] = useState(false);
  const [is2FADialogOpen, setIs2FADialogOpen] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  // Mock sessions state
  const [sessions, setSessions] = useState([
    { id: "1", device: "Desktop", browser: "Chrome", location: "Kathmandu, Nepal", active: "Now", icon: Monitor, isCurrent: true },
    { id: "2", device: "Mobile App", browser: "iPhone 14", location: "Paris, France", active: "2 days ago", icon: Smartphone, isCurrent: false },
    { id: "3", device: "Laptop", browser: "Safari", location: "London, UK", active: "1 week ago", icon: Laptop, isCurrent: false },
  ]);

  const calculateStrength = (pass: string) => {
    let score = 0;
    if (pass.length > 8) score += 25;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass)) score += 25;
    return score;
  };

  const strength = calculateStrength(passwords.new);
  const strengthColor = strength <= 25 ? "bg-destructive" : strength <= 50 ? "bg-amber-500" : strength <= 75 ? "bg-blue-500" : "bg-success";
  const strengthText = strength <= 25 ? "Weak" : strength <= 50 ? "Fair" : strength <= 75 ? "Good" : "Strong";

  const handleUpdatePassword = async () => {
    if (!passwords.new || !passwords.confirm) {
      toast.error("Please fill in all fields");
      return;
    }

    if (passwords.new !== passwords.confirm) {
      toast.error("New passwords do not match");
      return;
    }

    if (strength < 50) {
      toast.error("Password is too weak");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new
      });

      if (error) throw error;

      await trackActivity("Change Password", "security_update");
      toast.success("Password updated successfully");
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const handleSetup2FA = () => {
    setIs2FADialogOpen(true);
    trackActivity("Initiate 2FA Setup", "security_update");
  };

  const handleVerify2FA = () => {
    if (twoFactorCode.length === 6) {
      setIs2FAEnabled(true);
      setIs2FADialogOpen(false);
      setTwoFactorCode("");
      toast.success("Two-factor authentication enabled successfully");
      trackActivity("Enable 2FA", "security_update");
    } else {
      toast.error("Please enter a valid 6-digit code");
    }
  };

  const handleRevokeOtherSessions = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: 'others' });
      if (error) throw error;

      await trackActivity("Revoke Other Sessions", "security_update");
      setSessions(sessions.filter(s => s.isCurrent));
      toast.success("All other active sessions have been revoked");
    } catch (error: any) {
      toast.error(error.message || "Failed to revoke sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = (id: string) => {
    setSessions(sessions.filter(s => s.id !== id));
    toast.success("Session revoked successfully");
    trackActivity("Revoke Session", "security_update");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Change Password
          </CardTitle>
          <CardDescription>Secure your account with a strong password.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrent ? "text" : "password"}
                value={passwords.current}
                onChange={(e) => setPasswords({...passwords, current: e.target.value})}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNew ? "text" : "password"}
                value={passwords.new}
                onChange={(e) => setPasswords({...passwords, new: e.target.value})}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {passwords.new && (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs mb-1">
                  <span>Strength: <span className="font-medium">{strengthText}</span></span>
                  <span>{strength}%</span>
                </div>
                <Progress value={strength} className="h-1" indicatorClassName={strengthColor} />
                <ul className="text-[10px] space-y-1 mt-2 text-muted-foreground">
                  <li className="flex items-center gap-1">
                    {passwords.new.length > 8 ? <Check size={10} className="text-success" /> : <X size={10} />}
                    At least 8 characters
                  </li>
                  <li className="flex items-center gap-1">
                    {/[A-Z]/.test(passwords.new) ? <Check size={10} className="text-success" /> : <X size={10} />}
                    At least one uppercase letter
                  </li>
                  <li className="flex items-center gap-1">
                    {/[0-9]/.test(passwords.new) ? <Check size={10} className="text-success" /> : <X size={10} />}
                    At least one number
                  </li>
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                value={passwords.confirm}
                onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <Button
            variant="gold"
            onClick={handleUpdatePassword}
            disabled={loading || !passwords.new || passwords.new !== passwords.confirm}
            className="w-full sm:w-auto"
          >
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            Two-Factor Authentication (2FA)
          </CardTitle>
          <CardDescription>Add an extra layer of security to your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-dashed">
            <div>
              <p className="font-medium flex items-center gap-2">
                Authenticator App
                {is2FAEnabled && <Badge variant="outline" className="text-success border-success/30 bg-success/10 ml-2">Enabled</Badge>}
              </p>
              <p className="text-sm text-muted-foreground">Use an app like Google Authenticator to get security codes.</p>
            </div>
            <Button variant={is2FAEnabled ? "outline" : "gold"} onClick={handleSetup2FA}>
              {is2FAEnabled ? "Reconfigure" : "Setup 2FA"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-primary" />
              Login Sessions
            </CardTitle>
            <CardDescription>Manage your active sessions across different devices.</CardDescription>
          </div>
          {sessions.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive w-full sm:w-auto"
              onClick={handleRevokeOtherSessions}
              disabled={loading}
            >
              Revoke All Others
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between py-3 px-1 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-full">
                    <session.icon className={`h-4 w-4 ${session.isCurrent ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{session.device} • {session.browser}</p>
                      {session.isCurrent && (
                        <Badge variant="outline" className="text-[10px] h-4 text-success border-success/30 bg-success/10">Active Now</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{session.location} • {session.active}</p>
                  </div>
                </div>
                {!session.isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-destructive hover:bg-destructive/10"
                    onClick={() => handleRevokeSession(session.id)}
                    disabled={loading}
                  >
                    Revoke
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={is2FADialogOpen} onOpenChange={setIs2FADialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Setup Authenticator App</DialogTitle>
            <DialogDescription>
              Scan the QR code below using your authenticator app.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6 space-y-4">
            <div className="p-4 bg-white rounded-xl border-4 border-muted">
              <QrCode className="h-40 w-40 text-black" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">Or enter code manually:</p>
              <code className="px-3 py-1 bg-muted rounded text-lg font-mono tracking-widest">
                LUXE-STAY-2FA-SECURE
              </code>
            </div>
            <div className="w-full space-y-2">
              <Label htmlFor="2fa-code">Verification Code</Label>
              <Input
                id="2fa-code"
                placeholder="000000"
                className="text-center text-2xl tracking-[0.5em] font-mono"
                maxLength={6}
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIs2FADialogOpen(false)}>Cancel</Button>
            <Button variant="gold" onClick={handleVerify2FA}>Verify & Enable</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
