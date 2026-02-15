import { ServiceBootstrap } from "../shared/ServiceBootstrap";

export function FinancialConfigurationService() {
  return (
    <ServiceBootstrap
      title="Financial Configuration Service"
      category="Setup"
      description="Manage journal types, approval workflows, posting rules, and exchange rate sources."
    />
  );
}
