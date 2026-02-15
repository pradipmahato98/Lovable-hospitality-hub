import { MainLayout } from "@/components/layout/MainLayout";
import { POSDashboard, POSHeader } from "@/components/pos";

const POS = () => {
  return (
    <MainLayout>
      <POSHeader />
      <POSDashboard />
    </MainLayout>
  );
};

export default POS;
