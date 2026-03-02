import { MainLayout } from "@/components/layout/MainLayout";
import { POSDashboard, POSHeader } from "@/components/pos";

const POS = () => {
  return (
    <MainLayout title="Point of Sale" subtitle="Manage your restaurant and bar operations">
      <POSHeader />
      <POSDashboard />
    </MainLayout>
  );
};

export default POS;
