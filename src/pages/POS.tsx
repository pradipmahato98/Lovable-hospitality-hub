import { MainLayout } from "@/components/layout/MainLayout";
import { POSDashboard } from "@/components/pos/POSDashboard";

const POS = () => {
  return (
    <MainLayout title="POS Dashboard" subtitle="Restaurant and bar management overview">
      <POSDashboard />
    </MainLayout>
  );
};

export default POS;
