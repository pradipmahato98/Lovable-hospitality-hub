import React from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StaffClockPanel, POSHeader } from "@/components/pos";

const POSClock = () => {
  return (
    <MainLayout fixedHeight title="Staff Clock In/Out" subtitle="Manage staff attendance and shifts">
      <div className="flex flex-col h-full overflow-hidden">
        <POSHeader />
        <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide p-4 sm:p-6">
          <StaffClockPanel />
        </div>
      </div>
    </MainLayout>
  );
};

export default POSClock;
