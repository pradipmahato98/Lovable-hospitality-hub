import { MainLayout } from "@/components/layout/MainLayout";
import { POSDashboard, POSHeader } from "@/components/pos";

const POS = () => {
  return (
    <MainLayout title="Point of Sale" subtitle="Manage your restaurant and bar operations">
      <div className="flex flex-col space-y-6">
        <POSHeader />
        <POSDashboard />
      </div>
    </MainLayout>
  );
};

export default POS;
