import { ServiceBootstrap } from "../shared/ServiceBootstrap";

export function TaxConfigurationService() {
  return (
    <ServiceBootstrap
      title="Tax Configuration Service"
      category="Setup"
      description="Manage tax codes, tax slabs, and region-specific rules."
    />
  );
}
