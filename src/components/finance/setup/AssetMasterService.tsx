import { ServiceBootstrap } from "../shared/ServiceBootstrap";

export function AssetMasterService() {
  return (
    <ServiceBootstrap
      title="Asset Master Service"
      category="Setup"
      description="Manage asset categories, depreciation methods, and asset numbering rules."
    />
  );
}
