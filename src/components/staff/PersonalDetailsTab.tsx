import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { User, Mail, Phone, MapPin, Loader2, Camera, FileText, FileDown, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-bridge";
import { trackActivity } from "@/utils/auditLogger";
import { generateSecureRandomString } from "@/utils/security";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SalarySlip } from "@/components/hr/SalarySlip";
import {
  downloadSalarySlipPDF,
  downloadSalarySlipExcel,
  EmployeeInfo,
  SalaryDetails
} from "@/utils/salaryUtils";
import { format } from "date-fns";

export const PersonalDetailsTab = () => {
  const { profile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    phone: profile?.phone || "",
  });

  const [previewSlipOpen, setPreviewSlipOpen] = useState(false);

  const getMockEmployeeInfo = (): EmployeeInfo => {
    return {
      employeeName: `${profile?.first_name} ${profile?.last_name}`,
      employeeId: profile?.id?.substring(0, 8).toUpperCase() || "EMP-001",
      designation: profile?.role === 'admin' ? "Administrator" : "Staff Member",
      department: "Management",
      payPeriod: "Jan 2024",
      employeePan: "ABCDE1234F",
      bankAccountNo: "XXXX-XXXX-1234",
      dateOfPayment: format(new Date(), "yyyy-MM-dd"),
    };
  };

  const getMockSalaryDetails = (): SalaryDetails => {
    const base = 4000;
    return {
      basicSalary: Math.round(base * 0.6),
      houseRentAllowance: Math.round(base * 0.2),
      conveyanceAllowance: 1600,
      medicalAllowance: 1250,
      specialAllowance: Math.round(base * 0.1),
      otherEarnings: 0,
      providentFund: Math.round(base * 0.08),
      professionalTax: 200,
      incomeTax: 300,
      healthInsurance: 500,
      otherDeductions: 0,
    };
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await updateProfile(formData);
      if (error) throw error;
      await trackActivity("Update Personal Information", "profile_update", formData);
      toast.success("Personal information updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile?.id}-${generateSecureRandomString(8)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await api.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = api.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await updateProfile({
        avatar_url: publicUrl,
      });

      if (updateError) throw updateError;

      await trackActivity("Update Avatar", "avatar_update", { url: publicUrl });
      toast.success("Avatar updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div
            className="group relative h-32 w-32 rounded-full bg-gradient-gold flex items-center justify-center text-4xl font-bold text-primary-foreground overflow-hidden cursor-pointer"
            onClick={handleAvatarClick}
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <span>{profile?.first_name?.[0]}{profile?.last_name?.[0]}</span>
            )}

            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Camera className="h-8 w-8 text-white" />}
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
          />

          <Button variant="outline" size="sm" onClick={handleAvatarClick} disabled={uploading}>
            {uploading ? "Uploading..." : "Change Avatar"}
          </Button>
          <p className="text-[10px] text-muted-foreground">JPG, GIF or PNG. Max size 2MB</p>

          <div className="w-full pt-4 border-t mt-4">
            <Button
              variant="outline"
              className="w-full gap-2 border-primary/20 hover:bg-primary/5"
              onClick={() => setPreviewSlipOpen(true)}
            >
              <FileText className="h-4 w-4 text-primary" />
              My Latest Salary Slip
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your personal details and contact information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="email" className="pl-9" defaultValue={profile?.email || ""} disabled />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                className="pl-9"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>
          <Button variant="gold" onClick={handleSave} disabled={loading} className="w-full sm:w-auto">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      <Dialog open={previewSlipOpen} onOpenChange={setPreviewSlipOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>My Salary Slip</DialogTitle>
            <DialogDescription>
              Preview and download your latest salary slip
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => downloadSalarySlipPDF(getMockEmployeeInfo(), getMockSalaryDetails())}
              >
                <FileDown className="h-4 w-4" />
                Download PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => downloadSalarySlipExcel(getMockEmployeeInfo(), getMockSalaryDetails())}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Download Excel
              </Button>
            </div>

            <div className="border rounded-lg p-4 bg-slate-50">
              <SalarySlip
                {...getMockEmployeeInfo()}
                details={getMockSalaryDetails()}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
