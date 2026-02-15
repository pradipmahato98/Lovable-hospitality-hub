import { ServiceBootstrap } from "../shared/ServiceBootstrap";

export function CustomerMasterService() {
  return (
    <ServiceBootstrap
      title="Customer Master Service"
      category="Setup"
      description="Manage customer and corporate profiles, credit limits, and billing templates."
    />
  );
}
