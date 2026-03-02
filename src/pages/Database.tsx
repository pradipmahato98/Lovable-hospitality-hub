import { MainLayout } from "@/components/layout/MainLayout";
import { DatabaseControlCenter } from "@/components/database/DatabaseControlCenter";

const Database = () => {
  return (
    <MainLayout
      title="Database Control Center"
      subtitle="Complete control over your database, tables, and system operations"
    >
      <DatabaseControlCenter />
    </MainLayout>
  );
};

export default Database;
