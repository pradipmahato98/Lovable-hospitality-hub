import { ServiceBootstrap } from "../shared/ServiceBootstrap";

export function VendorMasterService() {
  return (
    <ServiceBootstrap
      title="Vendor Master Service"
      category="Setup"
      description="Manage vendor profiles, payment terms, and withholding tax definitions."
    />
  );
}
