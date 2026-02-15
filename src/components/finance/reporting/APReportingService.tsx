import { ServiceBootstrap } from "../shared/ServiceBootstrap";

export function APReportingService() {
  return (
    <ServiceBootstrap
      title="AP Reporting Service"
      category="Reporting"
      description="AP Aging, vendor statements, and GRN/invoice variances."
    />
  );
}
