import { ServiceBootstrap } from "../shared/ServiceBootstrap";

export function BudgetExecutionService() {
  return (
    <ServiceBootstrap
      title="Budget Execution Service"
      category="Transactions"
      description="Data entry for budgets, forecast submissions, and variance calculations."
    />
  );
}
