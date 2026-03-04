import { MainLayout } from "@/components/layout/MainLayout";
import { JournalManagementService } from "@/components/finance/transactions/JournalManagementService";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBusinessDate } from "@/hooks/useSettings";

export default function JournalRegister() {
  const navigate = useNavigate();
  const { data: businessDate } = useBusinessDate();

  return (
    <MainLayout
      title="Journal Register"
      subtitle={`Manage all accounting vouchers | Business Date: ${businessDate || "Loading..."}`}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/finance")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Finance
          </Button>
          <Button onClick={() => navigate("/finance/journal/new")} className="gap-2">
            <Plus className="h-4 w-4" />
            New Journal Entry
          </Button>
        </div>
      }
    >
      <div className="max-w-7xl mx-auto">
        <JournalManagementService />
      </div>
    </MainLayout>
  );
}
