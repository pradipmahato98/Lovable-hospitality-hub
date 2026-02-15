import { ServiceBootstrap } from "../shared/ServiceBootstrap";

export function TaxCalculationService() {
  return (
    <ServiceBootstrap
      title="Tax Calculation & Booking Service"
      category="Transactions"
      description="Automated tax computation for AR/AP and period tax closure."
    />
  );
}
